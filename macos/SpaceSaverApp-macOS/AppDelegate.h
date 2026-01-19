#import <Cocoa/Cocoa.h>
#import <React/RCTBridgeDelegate.h>

@interface AppDelegate : NSObject <NSApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) NSWindow *window;

@end
