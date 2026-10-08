#!/usr/bin/env python3
"""Spawn daemon yang kebal reaper PDEATHSIG: double-fork + prctl(PR_SET_PDEATHSIG, 0)."""
import os, sys, signal, subprocess

if len(sys.argv) < 2:
    print("Usage: daemonize.py <command> [args...]")
    sys.exit(1)

def daemonize():
    # fork pertama
    pid = os.fork()
    if pid > 0:
        os._exit(0)  # parent langsung keluar
    os.setsid()
    # fork kedua (pastikan bukan session leader — tak bisa dapat tty)
    pid = os.fork()
    if pid > 0:
        os._exit(0)
    # reset PDEATHSIG agar tidak ikut mati saat parent mati
    try:
        import ctypes
        libc = ctypes.CDLL("libc.so.6", use_errno=True)
        libc.prctl(1, 0, 0, 0, 0)  # PR_SET_PDEATHSIG = 1, SIG=0 (off)
    except Exception as e:
        print(f"prctl warning: {e}", file=sys.stderr)
    # tutup stdio
    devnull = os.open(os.devnull, os.O_RDWR)
    os.dup2(devnull, 0)
    os.dup2(devnull, 1)
    os.dup2(devnull, 2)
    if devnull > 2:
        os.close(devnull)

daemonize()
os.execvp(sys.argv[1], sys.argv[1:])
