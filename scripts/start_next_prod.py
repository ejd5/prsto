import subprocess, os, sys, time

LOG = "/tmp/nextdev.log"
CWD = "/home/z/my-project/elton-os"

log_fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
err_fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
devnull = os.open("/dev/null", os.O_RDONLY)

pid = os.fork()
if pid > 0:
    os.waitpid(pid, 0)
    sys.exit(0)

os.setsid()
pid2 = os.fork()
if pid2 > 0:
    os._exit(0)

os.dup2(devnull, 0)
os.dup2(log_fd, 1)
os.dup2(err_fd, 2)
os.close(log_fd)
os.close(err_fd)
os.close(devnull)

env = os.environ.copy()
env["PORT"] = "3000"
env["NODE_ENV"] = "production"
env["DATABASE_URL"] = "postgresql://neondb_owner:npg_eD81irYCovjb@ep-dawn-star-ab2wpk8t.eu-west-2.aws.neon.tech/neondb?sslmode=require"
env["PATH"] = os.path.join(CWD, "node_modules", ".bin") + ":" + env.get("PATH", "")
os.chdir(CWD)

next_bin = os.path.join(CWD, "node_modules", ".bin", "next")
os.execve(next_bin, [next_bin, "start", "-p", "3000"], env)
