#!/usr/bin/env python3
import os, sys, subprocess, time

def daemonize():
    pid = os.fork()
    if pid > 0: return False
    os.setsid()
    os.umask(0)
    pid = os.fork()
    if pid > 0: os._exit(0)
    sys.stdout.flush()
    sys.stderr.flush()
    with open('/dev/null', 'r') as f: os.dup2(f.fileno(), 0)
    log = open('/tmp/prsto-dev.log', 'a')
    os.dup2(log.fileno(), 1)
    os.dup2(log.fileno(), 2)
    return True

def main():
    if not daemonize():
        print("Daemon started")
        return
    with open('/tmp/prsto-dev-daemon.pid', 'w') as f:
        f.write(str(os.getpid()))
    os.chdir('/home/z/my-project/elton-os')
    env = os.environ.copy()
    env['PORT'] = '3000'
    env['HOSTNAME'] = '0.0.0.0'
    env['NODE_OPTIONS'] = '--max-old-space-size=1024'
    with open('.env.local') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line: continue
            key, _, val = line.partition('=')
            env[key.strip()] = val.strip().strip('"').strip("'")
    while True:
        with open('/tmp/watchdog.log', 'a') as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting dev server...\n")
        proc = subprocess.Popen(['npx', 'next', 'dev', '--port', '3000'],
            cwd='/home/z/my-project/elton-os', env=env,
            stdout=open('/tmp/prsto-dev.log', 'a'), stderr=subprocess.STDOUT)
        with open('/tmp/watchdog.log', 'a') as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Dev PID={proc.pid}\n")
        proc.wait()
        with open('/tmp/watchdog.log', 'a') as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Died rc={proc.returncode}, restart in 3s\n")
        time.sleep(3)

if __name__ == '__main__': main()
