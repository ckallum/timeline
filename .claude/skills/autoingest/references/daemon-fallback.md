# Daemon fallback for autoingest

By default, autoingest runs via `/loop` inside an active Claude session. This is intentional: background ingest only fires when the user is at their machine.

If the user wants unattended daemon behavior, here's the fallback:

## launchd plist (macOS)

Save as `~/Library/LaunchAgents/com.timeline.autoingest.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.timeline.autoingest</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/claude</string>
        <string>--print</string>
        <string>/autoingest</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/callumke/Projects/timeline</string>
    <key>StartInterval</key>
    <integer>86400</integer>
    <key>StandardOutPath</key>
    <string>/tmp/timeline-autoingest.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/timeline-autoingest-error.log</string>
</dict>
</plist>
```

Load: `launchctl load ~/Library/LaunchAgents/com.timeline.autoingest.plist`
Unload: `launchctl unload ~/Library/LaunchAgents/com.timeline.autoingest.plist`

## Do not install by default
This is a "here's how if you want it" note. The recommended approach is `/loop 24h /autoingest` in an active session.
