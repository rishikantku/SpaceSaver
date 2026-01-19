/**
 * SpaceSaver - Native macOS Bridge
 * 
 * Swift implementation of the native module for macOS operations.
 * This provides direct access to macOS APIs for file system operations,
 * application management, and system information.
 * 
 * Designed for macOS 15+ on Apple Silicon M2.
 */

import Foundation
import AppKit
import CommonCrypto

@objc(MacOSBridge)
class MacOSBridge: NSObject {
  
  // MARK: - Module Setup
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // MARK: - File System Operations
  
  @objc
  func getFileInfo(_ path: String,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let fileManager = FileManager.default
        let attributes = try fileManager.attributesOfItem(atPath: path)
        
        let result: [String: Any] = [
          "size": (attributes[.size] as? Int64) ?? 0,
          "created": ((attributes[.creationDate] as? Date)?.timeIntervalSince1970 ?? 0) * 1000,
          "modified": ((attributes[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0) * 1000,
          "accessed": ((attributes[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0) * 1000,
          "isDirectory": (attributes[.type] as? FileAttributeType) == .typeDirectory,
          "isSymlink": (attributes[.type] as? FileAttributeType) == .typeSymbolicLink,
          "permissions": String(format: "%o", (attributes[.posixPermissions] as? Int) ?? 0)
        ]
        
        resolve(result)
      } catch {
        reject("FILE_ERROR", "Failed to get file info: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func listDirectory(_ path: String,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let fileManager = FileManager.default
        let contents = try fileManager.contentsOfDirectory(atPath: path)
        resolve(contents)
      } catch {
        reject("FILE_ERROR", "Failed to list directory: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func getDirectorySize(_ path: String,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      let fileManager = FileManager.default
      var totalSize: Int64 = 0
      
      if let enumerator = fileManager.enumerator(atPath: path) {
        while let file = enumerator.nextObject() as? String {
          let filePath = (path as NSString).appendingPathComponent(file)
          do {
            let attributes = try fileManager.attributesOfItem(atPath: filePath)
            if let size = attributes[.size] as? Int64 {
              totalSize += size
            }
          } catch {
            // Skip files we can't access
          }
        }
      }
      
      resolve(totalSize)
    }
  }
  
  @objc
  func deleteFile(_ path: String,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try FileManager.default.removeItem(atPath: path)
        resolve(true)
      } catch {
        reject("FILE_ERROR", "Failed to delete file: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func deleteDirectory(_ path: String,
                       recursive: Bool,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try FileManager.default.removeItem(atPath: path)
        resolve(true)
      } catch {
        reject("FILE_ERROR", "Failed to delete directory: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func moveFile(_ source: String,
                destination: String,
                resolver resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try FileManager.default.moveItem(atPath: source, toPath: destination)
        resolve(true)
      } catch {
        reject("FILE_ERROR", "Failed to move file: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func copyFile(_ source: String,
                destination: String,
                resolver resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try FileManager.default.copyItem(atPath: source, toPath: destination)
        resolve(true)
      } catch {
        reject("FILE_ERROR", "Failed to copy file: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func fileExists(_ path: String,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    let exists = FileManager.default.fileExists(atPath: path)
    resolve(exists)
  }
  
  @objc
  func createFile(_ path: String,
                  size: Int,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      let data = Data(count: size)
      do {
        try data.write(to: URL(fileURLWithPath: path))
        resolve(true)
      } catch {
        reject("FILE_ERROR", "Failed to create file: \(error.localizedDescription)", error)
      }
    }
  }
  
  // MARK: - Disk Information
  
  @objc
  func getDiskInfo(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      let url = URL(fileURLWithPath: "/")
      let values = try url.resourceValues(forKeys: [
        .volumeTotalCapacityKey,
        .volumeAvailableCapacityKey,
        .volumeNameKey
      ])
      
      let total = values.volumeTotalCapacity ?? 0
      let available = values.volumeAvailableCapacity ?? 0
      
      let result: [String: Any] = [
        "totalSpace": total,
        "usedSpace": total - available,
        "freeSpace": available,
        "mountPoint": "/",
        "fileSystem": "apfs"
      ]
      
      resolve(result)
    } catch {
      reject("DISK_ERROR", "Failed to get disk info: \(error.localizedDescription)", error)
    }
  }
  
  // MARK: - Application Management
  
  @objc
  func getInstalledApplications(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      var applications: [[String: Any]] = []
      let appPaths = ["/Applications", NSHomeDirectory() + "/Applications"]
      
      for appPath in appPaths {
        if let contents = try? FileManager.default.contentsOfDirectory(atPath: appPath) {
          for item in contents where item.hasSuffix(".app") {
            let fullPath = (appPath as NSString).appendingPathComponent(item)
            let plistPath = (fullPath as NSString).appendingPathComponent("Contents/Info.plist")
            
            if let plist = NSDictionary(contentsOfFile: plistPath) {
              let appInfo: [String: Any] = [
                "name": plist["CFBundleName"] as? String ?? item.replacingOccurrences(of: ".app", with: ""),
                "bundleId": plist["CFBundleIdentifier"] as? String ?? "",
                "path": fullPath,
                "version": plist["CFBundleShortVersionString"] as? String ?? "1.0",
                "icon": ""
              ]
              applications.append(appInfo)
            }
          }
        }
      }
      
      resolve(applications)
    }
  }
  
  @objc
  func getApplicationLastUsed(_ bundleId: String,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      // Use Spotlight to find last used date
      let query = NSMetadataQuery()
      query.predicate = NSPredicate(format: "kMDItemCFBundleIdentifier == %@", bundleId)
      query.searchScopes = ["/Applications"]
      
      // For simplicity, return nil - in production, implement proper Spotlight query
      resolve(nil)
    }
  }
  
  @objc
  func uninstallApplication(_ path: String,
                            resolver resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // Move to Trash
        var trashURL: NSURL?
        try FileManager.default.trashItem(at: URL(fileURLWithPath: path), resultingItemURL: &trashURL)
        resolve(true)
      } catch {
        reject("APP_ERROR", "Failed to uninstall: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func openApplication(_ bundleId: String,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleId) {
        NSWorkspace.shared.openApplication(at: appURL,
                                          configuration: NSWorkspace.OpenConfiguration()) { _, error in
          if let error = error {
            reject("APP_ERROR", "Failed to open app: \(error.localizedDescription)", error)
          } else {
            resolve(true)
          }
        }
      } else {
        reject("APP_ERROR", "Application not found", nil)
      }
    }
  }
  
  // MARK: - System Commands
  
  @objc
  func executeCommand(_ command: String,
                      args: [String],
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      let process = Process()
      process.executableURL = URL(fileURLWithPath: command)
      process.arguments = args
      
      let stdout = Pipe()
      let stderr = Pipe()
      process.standardOutput = stdout
      process.standardError = stderr
      
      do {
        try process.run()
        process.waitUntilExit()
        
        let stdoutData = stdout.fileHandleForReading.readDataToEndOfFile()
        let stderrData = stderr.fileHandleForReading.readDataToEndOfFile()
        
        let result: [String: Any] = [
          "stdout": String(data: stdoutData, encoding: .utf8) ?? "",
          "stderr": String(data: stderrData, encoding: .utf8) ?? "",
          "exitCode": process.terminationStatus
        ]
        
        resolve(result)
      } catch {
        reject("CMD_ERROR", "Failed to execute command: \(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func openURL(_ url: String,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if let nsurl = URL(string: url) {
        NSWorkspace.shared.open(nsurl)
        resolve(true)
      } else {
        reject("URL_ERROR", "Invalid URL", nil)
      }
    }
  }
  
  @objc
  func openSystemPreferences(_ pane: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if let url = URL(string: pane) {
        NSWorkspace.shared.open(url)
        resolve(true)
      } else {
        resolve(false)
      }
    }
  }
  
  // MARK: - Permissions
  
  @objc
  func hasFullDiskAccess(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Try to access a protected directory
    let protectedPath = NSHomeDirectory() + "/Library/Mail"
    let accessible = FileManager.default.isReadableFile(atPath: protectedPath)
    resolve(accessible)
  }
  
  @objc
  func requestFullDiskAccess(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles")!
      NSWorkspace.shared.open(url)
      resolve(nil)
    }
  }
  
  // MARK: - Checksums
  
  @objc
  func calculateChecksum(_ path: String,
                         algorithm: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      guard let data = FileManager.default.contents(atPath: path) else {
        reject("CHECKSUM_ERROR", "Could not read file", nil)
        return
      }
      
      // Using CommonCrypto for SHA256
      var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
      data.withUnsafeBytes {
        _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
      }
      
      let checksum = hash.map { String(format: "%02x", $0) }.joined()
      resolve(checksum)
    }
  }
  
  // MARK: - User Directories
  
  @objc
  func getHomeDirectory() -> String {
    return NSHomeDirectory()
  }
  
  @objc
  func getTempDirectory() -> String {
    return NSTemporaryDirectory()
  }
  
  @objc
  func getApplicationSupportDirectory() -> String {
    let paths = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
    return paths.first?.path ?? ""
  }
  
  @objc
  func getCachesDirectory() -> String {
    let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
    return paths.first?.path ?? ""
  }
}
