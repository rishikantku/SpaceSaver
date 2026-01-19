/**
 * SpaceSaver - Prediction Service
 * Predicts space usage trends and when disk will be full
 */

import { getCurrentPlatformService, IPlatformService } from '../platform';
import {
  UsageDataPoint,
  SpacePrediction,
  UsageHistory,
  DiskInfo,
} from '../types';
import { TIME } from '../constants';

const DEFAULT_RETENTION_DAYS = 90;

export class PredictionService {
  private platformService: IPlatformService;
  private history: UsageHistory;
  
  constructor() {
    this.platformService = getCurrentPlatformService();
    this.history = {
      dataPoints: [],
      lastUpdated: new Date(),
      retentionDays: DEFAULT_RETENTION_DAYS,
    };
    this.loadHistory();
  }
  
  /**
   * Record current disk usage
   */
  async recordUsage(): Promise<UsageDataPoint> {
    const diskInfo = await this.platformService.getDiskInfo();
    
    // Calculate daily change
    let dailyChange = 0;
    if (this.history.dataPoints.length > 0) {
      const lastPoint = this.history.dataPoints[this.history.dataPoints.length - 1];
      const timeDiff = Date.now() - new Date(lastPoint.timestamp).getTime();
      const usageDiff = diskInfo.usedSpace - lastPoint.usedSpace;
      
      // Normalize to daily change
      dailyChange = usageDiff * (TIME.DAY / timeDiff);
    }
    
    const dataPoint: UsageDataPoint = {
      timestamp: new Date(),
      usedSpace: diskInfo.usedSpace,
      freeSpace: diskInfo.freeSpace,
      dailyChange,
    };
    
    // Add to history
    this.history.dataPoints.push(dataPoint);
    this.history.lastUpdated = new Date();
    
    // Prune old data points
    this.pruneHistory();
    
    // Save history
    this.saveHistory();
    
    return dataPoint;
  }
  
  /**
   * Get space prediction based on usage history
   */
  async getPrediction(): Promise<SpacePrediction> {
    const diskInfo = await this.platformService.getDiskInfo();
    
    // Need at least 2 data points for prediction
    if (this.history.dataPoints.length < 2) {
      return {
        predictedFullDate: null,
        daysUntilFull: null,
        averageDailyGrowth: 0,
        trend: 'stable',
        confidence: 0,
        recommendations: ['Need more usage data. Keep the app running to collect data.'],
      };
    }
    
    // Calculate average daily growth
    const averageDailyGrowth = this.calculateAverageDailyGrowth();
    
    // Determine trend
    const trend = this.determineTrend();
    
    // Calculate days until full
    let daysUntilFull: number | null = null;
    let predictedFullDate: Date | null = null;
    
    if (averageDailyGrowth > 0) {
      daysUntilFull = Math.ceil(diskInfo.freeSpace / averageDailyGrowth);
      predictedFullDate = new Date(Date.now() + daysUntilFull * TIME.DAY);
    }
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      diskInfo,
      averageDailyGrowth,
      daysUntilFull,
      trend
    );
    
    return {
      predictedFullDate,
      daysUntilFull,
      averageDailyGrowth,
      trend,
      confidence,
      recommendations,
    };
  }
  
  /**
   * Get usage history
   */
  getHistory(): UsageHistory {
    return this.history;
  }
  
  /**
   * Get usage data for charts
   */
  getChartData(): {
    labels: string[];
    usedSpace: number[];
    freeSpace: number[];
  } {
    const labels: string[] = [];
    const usedSpace: number[] = [];
    const freeSpace: number[] = [];
    
    for (const point of this.history.dataPoints) {
      labels.push(new Date(point.timestamp).toLocaleDateString());
      usedSpace.push(point.usedSpace);
      freeSpace.push(point.freeSpace);
    }
    
    return { labels, usedSpace, freeSpace };
  }
  
  /**
   * Get weekly summary
   */
  getWeeklySummary(): {
    startDate: Date;
    endDate: Date;
    startUsage: number;
    endUsage: number;
    change: number;
    avgDailyChange: number;
  } | null {
    const weekAgo = new Date(Date.now() - 7 * TIME.DAY);
    const weekPoints = this.history.dataPoints.filter(
      p => new Date(p.timestamp) >= weekAgo
    );
    
    if (weekPoints.length < 2) {
      return null;
    }
    
    const startPoint = weekPoints[0];
    const endPoint = weekPoints[weekPoints.length - 1];
    
    const change = endPoint.usedSpace - startPoint.usedSpace;
    const avgDailyChange = change / 7;
    
    return {
      startDate: new Date(startPoint.timestamp),
      endDate: new Date(endPoint.timestamp),
      startUsage: startPoint.usedSpace,
      endUsage: endPoint.usedSpace,
      change,
      avgDailyChange,
    };
  }
  
  /**
   * Get monthly summary
   */
  getMonthlySummary(): {
    month: string;
    change: number;
    avgDailyChange: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[] {
    const summaries: {
      month: string;
      change: number;
      avgDailyChange: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    }[] = [];
    
    // Group by month
    const byMonth: Record<string, UsageDataPoint[]> = {};
    
    for (const point of this.history.dataPoints) {
      const date = new Date(point.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }
      byMonth[monthKey].push(point);
    }
    
    // Calculate summary for each month
    for (const [month, points] of Object.entries(byMonth)) {
      if (points.length < 2) continue;
      
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      
      const change = lastPoint.usedSpace - firstPoint.usedSpace;
      const daysInMonth = (
        new Date(lastPoint.timestamp).getTime() -
        new Date(firstPoint.timestamp).getTime()
      ) / TIME.DAY;
      const avgDailyChange = change / (daysInMonth || 1);
      
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (avgDailyChange > 50 * 1024 * 1024) { // > 50MB/day
        trend = 'increasing';
      } else if (avgDailyChange < -50 * 1024 * 1024) { // < -50MB/day
        trend = 'decreasing';
      }
      
      summaries.push({
        month,
        change,
        avgDailyChange,
        trend,
      });
    }
    
    return summaries.sort((a, b) => b.month.localeCompare(a.month));
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = {
      dataPoints: [],
      lastUpdated: new Date(),
      retentionDays: DEFAULT_RETENTION_DAYS,
    };
    this.saveHistory();
  }
  
  /**
   * Set history retention period
   */
  setRetentionDays(days: number): void {
    this.history.retentionDays = days;
    this.pruneHistory();
    this.saveHistory();
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private calculateAverageDailyGrowth(): number {
    if (this.history.dataPoints.length < 2) {
      return 0;
    }
    
    // Use weighted average, giving more weight to recent data
    let totalWeightedGrowth = 0;
    let totalWeight = 0;
    
    for (let i = 1; i < this.history.dataPoints.length; i++) {
      const current = this.history.dataPoints[i];
      const previous = this.history.dataPoints[i - 1];
      
      const timeDiff = (
        new Date(current.timestamp).getTime() -
        new Date(previous.timestamp).getTime()
      ) / TIME.DAY;
      
      if (timeDiff > 0) {
        const dailyGrowth = (current.usedSpace - previous.usedSpace) / timeDiff;
        const weight = i / this.history.dataPoints.length; // More recent = higher weight
        
        totalWeightedGrowth += dailyGrowth * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? totalWeightedGrowth / totalWeight : 0;
  }
  
  private determineTrend(): 'increasing' | 'stable' | 'decreasing' {
    const avgDailyGrowth = this.calculateAverageDailyGrowth();
    
    // Define thresholds in bytes per day
    const GROWTH_THRESHOLD = 10 * 1024 * 1024; // 10 MB/day
    const SHRINK_THRESHOLD = -10 * 1024 * 1024; // -10 MB/day
    
    if (avgDailyGrowth > GROWTH_THRESHOLD) {
      return 'increasing';
    } else if (avgDailyGrowth < SHRINK_THRESHOLD) {
      return 'decreasing';
    }
    
    return 'stable';
  }
  
  private calculateConfidence(): number {
    // Confidence is based on:
    // 1. Number of data points (more = better)
    // 2. Consistency of data (less variance = better)
    // 3. Time span of data (longer = better)
    
    const pointCount = this.history.dataPoints.length;
    
    // Factor 1: Point count (0-40%)
    const pointFactor = Math.min(pointCount / 30, 1) * 0.4;
    
    // Factor 2: Time span (0-30%)
    let timeSpanFactor = 0;
    if (pointCount >= 2) {
      const firstDate = new Date(this.history.dataPoints[0].timestamp);
      const lastDate = new Date(this.history.dataPoints[pointCount - 1].timestamp);
      const daySpan = (lastDate.getTime() - firstDate.getTime()) / TIME.DAY;
      timeSpanFactor = Math.min(daySpan / 30, 1) * 0.3;
    }
    
    // Factor 3: Consistency (0-30%)
    let consistencyFactor = 0.3;
    if (pointCount >= 3) {
      const dailyChanges = this.history.dataPoints
        .slice(1)
        .map(p => p.dailyChange)
        .filter(c => !isNaN(c));
      
      if (dailyChanges.length > 0) {
        const mean = dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length;
        const variance = dailyChanges.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / dailyChanges.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower std deviation = higher consistency
        const normalizedStdDev = Math.min(stdDev / Math.abs(mean || 1), 1);
        consistencyFactor = (1 - normalizedStdDev) * 0.3;
      }
    }
    
    return Math.round((pointFactor + timeSpanFactor + consistencyFactor) * 100) / 100;
  }
  
  private generateRecommendations(
    diskInfo: DiskInfo,
    avgDailyGrowth: number,
    daysUntilFull: number | null,
    trend: 'increasing' | 'stable' | 'decreasing'
  ): string[] {
    const recommendations: string[] = [];
    
    // Critical space warning
    if (diskInfo.freeSpace < 10 * 1024 * 1024 * 1024) { // < 10GB
      recommendations.push('⚠️ Critical: Less than 10GB free. Clean up immediately.');
    } else if (diskInfo.freeSpace < 50 * 1024 * 1024 * 1024) { // < 50GB
      recommendations.push('⚠️ Warning: Less than 50GB free. Consider cleaning up.');
    }
    
    // Days until full
    if (daysUntilFull !== null && daysUntilFull < 30) {
      recommendations.push(
        `🚨 Disk may be full in ${daysUntilFull} days at current usage rate.`
      );
    } else if (daysUntilFull !== null && daysUntilFull < 90) {
      recommendations.push(
        `📊 Disk may be full in about ${Math.round(daysUntilFull / 30)} months.`
      );
    }
    
    // Growth rate recommendations
    if (avgDailyGrowth > 500 * 1024 * 1024) { // > 500MB/day
      recommendations.push('📈 High daily growth detected. Check for large downloads or caches.');
    }
    
    // Trend-based recommendations
    if (trend === 'increasing') {
      recommendations.push('📈 Usage trend is increasing. Enable Auto Mode for automatic cleanup.');
    } else if (trend === 'decreasing') {
      recommendations.push('📉 Great job! Usage is decreasing. Keep up the good habits.');
    } else {
      recommendations.push('📊 Usage is stable. Consider scheduling regular cleanups.');
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ Your disk usage looks healthy.');
    }
    
    return recommendations;
  }
  
  private pruneHistory(): void {
    const cutoffDate = new Date(
      Date.now() - this.history.retentionDays * TIME.DAY
    );
    
    this.history.dataPoints = this.history.dataPoints.filter(
      p => new Date(p.timestamp) >= cutoffDate
    );
  }
  
  private loadHistory(): void {
    try {
      // In React Native, use AsyncStorage or similar
      // For now, this is a placeholder
      // const stored = await AsyncStorage.getItem(STORAGE_KEY);
      // if (stored) {
      //   this.history = JSON.parse(stored);
      // }
      console.log('Loading usage history...');
    } catch (error) {
      console.error('Failed to load usage history:', error);
    }
  }
  
  private saveHistory(): void {
    try {
      // In React Native, use AsyncStorage or similar
      // await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
      console.log('Saving usage history...');
    } catch (error) {
      console.error('Failed to save usage history:', error);
    }
  }
}

export const predictionService = new PredictionService();
export default predictionService;
