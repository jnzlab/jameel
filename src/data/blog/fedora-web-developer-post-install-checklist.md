---
title: "Fedora for Web Developers: A Post-Install Checklist"
author: Jameel Ahmad
pubDatetime: 2026-09-23T00:00:00Z
slug: fedora-web-developer-post-install-checklist
featured: false
draft: true
tags:
  - linux
  - fedora
  - tutorial
  - podman
  - nextjs
description: "My Fedora post-install checklist for web development: updates, RPM Fusion codecs, Wi-Fi fixes, Node.js via nvm, pnpm and Podman for local Supabase."
---

<!-- TODO(author): Verify every command below on the current Fedora release before publishing, and note which version you tested on (the other Fedora posts used Fedora 43). -->

I use Fedora Workstation as my daily machine for web development. Every fresh install, I end up doing the same handful of things before I can actually write code, and a few of them have turned into full blog posts because they broke in interesting ways. This is the checklist I wish I had the first time, with links to the deeper write-ups.

## Table of contents

## 1. Update Everything First

Before installing anything else, bring the system fully up to date and reboot:

```bash
sudo dnf upgrade --refresh
sudo reboot
```

A fresh ISO can be weeks or months behind, and it is better to hit a kernel or driver change now than halfway through setting up your tools.

## 2. Check Your Wi-Fi Survives a Reboot

If you are on a laptop with an **Intel Wi-Fi 6 AX201** card, reboot a couple of times and make sure Wi-Fi comes back every time. On my ThinkPad it didn't: Fedora showed **"No Wi-Fi Adapter Found"** and `dmesg` had `iwlwifi ... failed with error -110`, but only on some boots.

The full fix (firmware, initramfs, `power_save=0` and a systemd fallback) is in [Fix Intel AX201 Wi-Fi not working on Fedora](/posts/fixing-wifi-intel-ax201-fedora/).

## 3. Enable RPM Fusion and Install Codecs

Fedora ships without proprietary codecs, so H.264 video can play as a blank screen out of the box. That matters more than it sounds for web work: screen recordings, demo videos and anything you test in a `<video>` tag.

Enable the RPM Fusion free and non-free repositories:

```bash
sudo dnf install https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
```

Then swap `ffmpeg-free` for the full FFmpeg and update the multimedia group:

```bash
sudo dnf swap ffmpeg-free ffmpeg --allowerasing
sudo dnf update @multimedia --setopt="install_weak_deps=False" --exclude=PackageKit-gstreamer-plugin
```

Why each of these is needed, and how I tracked it down, is in [Fedora H.264 codec missing](/posts/fixing-h264-codec-fedora/).

## 4. Install Basic Build Tools

Some npm packages compile native code on install, so you want a compiler toolchain and Git in place:

```bash
sudo dnf install git gcc gcc-c++ make
```

<!-- TODO(author): Confirm the package list, or switch to `sudo dnf group install development-tools` if that is what you use on the current release. -->

## 5. Install Node.js With nvm

I don't install Node from the Fedora repos. Different projects pin different Node versions, and **nvm** lets me switch per project without touching system packages or using `sudo` for global installs.

```bash
# TODO(author): check https://github.com/nvm-sh/nvm for the current version tag
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc

nvm install --lts
nvm alias default lts/*
node --version
```

Then install pnpm, which is what I use across my projects:

```bash
npm install -g pnpm
pnpm --version
```

<!-- TODO(author): Is this how you install pnpm (npm -g, corepack, or the standalone installer)? -->

## 6. Set Up Podman for Containers

Fedora ships **Podman** instead of Docker. It is daemonless and runs rootless by default, and for most local development it is a drop-in replacement. Tools that expect the Docker API (like the Supabase CLI) just need the Docker-compatible socket:

```bash
sudo dnf install -y podman podman-docker
systemctl --user enable --now podman.socket
echo 'export DOCKER_HOST="unix://${XDG_RUNTIME_DIR:-/run/user/$UID}/podman/podman.sock"' >> ~/.bashrc
source ~/.bashrc
```

With that in place you can run a full local Supabase stack for a Next.js app. The whole setup, including separate local and production environments, is in [Supabase local development with Podman on Fedora](/posts/nextjs-supabase-podman-dual-environments/).

## 7. After Every Major Upgrade: Check Your GNOME Extensions

This one isn't a day-one step, but it will bite you later. After a Fedora upgrade that moved me to a new GNOME Shell version, my extensions silently stopped working: user extensions had been globally disabled and the extension files were gone.

The quick check:

```bash
gsettings get org.gnome.shell disable-user-extensions
```

If it prints `true`, the fix and the rest of the story are in [GNOME extensions not working after a Fedora upgrade](/posts/fixing-gnome-extensions-fedora-upgrade/).

## The Short Version

1. `sudo dnf upgrade --refresh` and reboot
2. Reboot a few more times and make sure Wi-Fi comes back
3. Enable RPM Fusion and swap in full FFmpeg
4. Install Git and a compiler toolchain
5. Install Node.js with nvm, then pnpm
6. Set up Podman's Docker-compatible socket
7. After major upgrades, check your GNOME extensions

<!-- TODO(author): Anything else you always install (editor, browser, fonts, shell)? Add it here only if you actually use it. -->
