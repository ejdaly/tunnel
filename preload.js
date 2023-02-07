// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const processes = {};

window.addEventListener('DOMContentLoaded', () => {

  reload();
 
  document.getElementById("refresh").addEventListener('click', () => {
    reload();
  });

  document.getElementById("edit").addEventListener('click', () => {
    edit();
  });
})

function reload() {
  console.log("=== Reload ===");
  document.getElementById("tunnels").innerHTML = "";

  // Read the SSH config from ~/.ssh/tunnel
  //
  const OS = require("node:os");
  const FS = require("node:fs");
  const SSHConfig = require("ssh-config");

  const homedir = OS.homedir();
  const config_file = `${homedir}/.ssh/tunnel`;
  console.log({ homedir, config_file });

  if(!FS.existsSync(config_file)) {
    FS.writeFileSync(config_file, 
`
# The remote command needs to echo "SSHCONNECT" for tunnel.exe
# to acknowledge the connection
#
Host *
  RemoteCommand printf "SSHCONNECT"; sleep infinity
`);
  }

  let config = FS.readFileSync(config_file, "utf-8");
  console.log({ config });

  let parsed = SSHConfig.parse(config);
  console.log({ parsed });

  for(let p of parsed) {
    const { type, param, value } = p;

    if(type === 1 && param === "Host") {

      // .compute will work out the full config for this host
      // (e.g. if combined with wildcard / default vaules...)
      //
      const computed = parsed.compute(value);
      const { HostName, LocalForward = [] } = computed;

      // Only works for a single local forward rule per Host
      //
      if(LocalForward.length !== 1) continue;

      let [ local_port, remote_port_ ] = LocalForward[0].split(" ");
      let [ localhost, remote_port ] = remote_port_.split(":");

      // Must be connecting to localhost on the remote side
      //
      if(localhost !== "localhost") continue;

      const process = processes[value];

      // status is "" / "disconected", "connecting", "connected"
      //
      const status = processStatus(process) || "";
      console.log({ value, computed, status });

      const tunnel = document.createElement("div");
      tunnel.innerHTML = `
        <div class="tunnel" data-id="${value}" data-status="${status}" title="${status}">
          <div class="tunnel-title">
            ${value}
          </div>
          <div class="tunnel-details">
            <div>:${local_port}</div>
            <div class="material-icons">settings_ethernet</div>
            <div>${HostName}:${remote_port}</div>
          </div>
          <div class="tunnel-actions">
            <div id="${value}-start" class="material-icons start" title="Start">play_arrow</div>
            <div id="${value}-stop" class="material-icons stop" title="Stop">stop</div>
            <div class="connecting" title="Connecting"></div>
          </div>
        <div>
      `;
      document.getElementById("tunnels").appendChild(tunnel);

      document.getElementById(`${value}-start`).addEventListener("click", () => {
        console.log(`${value}-start`);
        log(`[${value}] Connecting`);

        const decoder = new TextDecoder();
        const child_process = require("node:child_process");
        log(`[${value}] ssh -F ${config_file} ${value}`);
        const process = child_process.spawn("ssh", [ "-F", config_file, value ]);
        processes[value] = process;
        process.stderr.on("data", (data) => {
          const text = decoder.decode(data);
          log(`[${value}] ${text}`);
        });
        process.stdout.on("data", (data) => {
          const text = decoder.decode(data);
          if(text === "SSHCONNECT") {
            process.SSHCONNECT = true;
            log(`[${value}] Connected`);
            reload();
          } else {
            log(`[${value}] ${text}`);
          }
        });
        process.on("close", (code) => {
          log(`[${value}] Exit: ${code}`);
          reload();
        });

        reload();
      });

      document.getElementById(`${value}-stop`).addEventListener("click", () => {
        log(`[${value}] Stop`);

        const process = processes[value];
        console.log({ process })
        if(process) {
          process.kill();
          setTimeout(() => {
            reload();
          }, 500)
        }
      });
    }
  }

}

// Get the status of any existing ssh process
//
function processStatus(process) {
  if(!process) return null;
  const { pid, exitCode, killed, SSHCONNECT } = process;
  if(!pid) return null;

  if(exitCode !== null || killed) return "disconnected";
  if(SSHCONNECT) return "connected";
  return "connecting";
}

// Log output to the #output div
//
function log(string) {
  string = string.trim("\n");
  console.log(string);
  document.getElementById("output").innerText += `${string}\n`;
  document.getElementById("output").scrollTop = 999999999;
}

// Edit the config file
//
async function edit() {
  const OS = require("node:os");
  const homedir = OS.homedir();
  const Open = require("open");
  await Open(`${homedir}/.ssh/tunnel`);
}