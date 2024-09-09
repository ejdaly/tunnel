# Tunnel (SSH Tunnel Manager)

[Build / Install](#build--install)  
[Configuration](#configuration)  
[Screenshots](#screenshots)  
[Limitations](#limitations)  

### Build / Install

Pre-built binaries available here: https://github.com/ejdaly/tunnel/releases

To build manually:

```sh
$ npm i

# Build standalone executable
$ npm run build-portable

# Build installer
$ npm run build-installer
```

Output files are in `./dist`.

### Configuration

Config file location: `$HOME/.ssh/tunnel`

Click the `Edit Config` button to open the config file for editing.

Config file format is the same as SSH client config (`man ssh_config` / https://man.openbsd.org/ssh_config).

To add port forwarding configurations, add a section like:

```sh
# Display name
Host mongo-db-01
  # Remote server IP address / DNS
  HostName 1.2.3.4
  LocalForward 9999 localhost:27017
  # Local port -^   Remote port -^
```

Click the `Refresh` button after editing the config file.

See also: https://man.openbsd.org/ssh_config#LocalForward

### Screenshots

![Example](<2024-09-09 09_29_14-Tunnel.png>)

### Limitations

  - Only tested on Windows.  
    (Should also work fine on Mac / Linux, since platform is Electron.)
  - Closing the app window terminates running tunnels.  
    (Would be nice to have a "run in background" option.)