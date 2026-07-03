#!/usr/bin/env python3
"""Démarre le serveur Next.js dev en mode daemon pleinement détaché."""
import subprocess, os, sys, time, signal

LOG = "/tmp/nextdev.log"
CWD = "/home/z/my-project/elton-os"

# Ouvre les fichiers de log AVANT le fork pour s'assurer qu'ils restent ouverts
log_fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
err_fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
devnull = os.open("/dev/null", os.O_RDONLY)

# Double fork + setsid pour détacher complètement
pid = os.fork()
if pid > 0:
    # Parent: attend que l'enfant confirme via fichier
    os.waitpid(pid, 0)
    sys.exit(0)

# Enfant 1: devient session leader
os.setsid()
pid2 = os.fork()
if pid2 > 0:
    os._exit(0)

# Enfant 2: redirect stdio
os.dup2(devnull, 0)
os.dup2(log_fd, 1)
os.dup2(err_fd, 2)
os.close(log_fd)
os.close(err_fd)
os.close(devnull)

# Lance next dev
env = os.environ.copy()
env["PORT"] = "3005"
env["NODE_ENV"] = "development"
env["PATH"] = os.path.join(CWD, "node_modules", ".bin") + ":" + env.get("PATH", "")
os.chdir(CWD)

# execvp remplace le process courant — pas de zombie
# Utilise le binaire local next (pas npx qui essaierait de réinstaller)
next_bin = os.path.join(CWD, "node_modules", ".bin", "next")
os.execve(next_bin, [next_bin, "dev", "-p", "3005"], env)
