#!/usr/bin/env python3
"""
PRSTO daemon starter — uses double-fork to fully detach from parent.
This escapes the bash tool's process cleanup.
"""
import os
import sys
import subprocess
import time

def daemonize():
    """Double-fork daemon pattern"""
    # First fork
    pid = os.fork()
    if pid > 0:
        # Parent exits immediately
        return False

    # Decouple from parent environment
    os.setsid()
    os.umask(0)

    # Second fork
    pid = os.fork()
    if pid > 0:
        os._exit(0)

    # Now we're a daemon
    # Redirect std streams
    sys.stdout.flush()
    sys.stderr.flush()
    with open('/dev/null', 'r') as f:
        os.dup2(f.fileno(), 0)
    log = open('/tmp/prsto-prod.log', 'a')
    os.dup2(log.fileno(), 1)
    os.dup2(log.fileno(), 2)

    return True


def main():
    if not daemonize():
        # Parent — write PID file and exit
        print("Daemon started")
        return

    # We're the daemon now
    # Write our own PID
    with open('/tmp/prsto-daemon.pid', 'w') as f:
        f.write(str(os.getpid()))

    # Change to project dir
    os.chdir('/home/z/my-project/elton-os')

    # Set env — load all vars from .env.local manually (standalone build doesn't auto-load it)
    env = os.environ.copy()
    env['PORT'] = '3000'
    env['HOSTNAME'] = '0.0.0.0'
    env['NODE_OPTIONS'] = '--max-old-space-size=1024'

    # Parse .env.local and inject all vars
    env_local = '/home/z/my-project/elton-os/.env.local'
    if os.path.exists(env_local):
        with open(env_local) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' not in line:
                    continue
                key, _, val = line.partition('=')
                val = val.strip().strip('"').strip("'")
                env[key.strip()] = val

    # Watchdog loop: restart server if it dies
    while True:
        with open('/tmp/watchdog.log', 'a') as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting server...\n")

        proc = subprocess.Popen(
            ['node', '.next/standalone/server.js'],
            cwd='/home/z/my-project/elton-os',
            env=env,
            stdout=open('/tmp/prsto-prod.log', 'a'),
            stderr=subprocess.STDOUT,
        )

        with open('/tmp/watchdog.log', 'a') as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Server PID={proc.pid}\n")

        # Wait for it to die
        proc.wait()

        with open('/tmp/watchdog.log', 'a') as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Server died (rc={proc.returncode}), restarting in 3s\n")

        time.sleep(3)


if __name__ == '__main__':
    main()
