# 📱 iOS App Documentation Index

Complete guide to configuring and building the Cheerio iOS app.

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[README.md](./README.md)** - Overview and features
2. **[SETUP.md](./SETUP.md)** - Initial setup instructions
3. **[CONFIG-SETUP.md](./CONFIG-SETUP.md)** - Environment configuration (5 min read)

---

## 📖 Configuration Guides

### Environment Variables & Config

| Document                                         | Description                               | Read Time |
| ------------------------------------------------ | ----------------------------------------- | --------- |
| **[CONFIG-SETUP.md](./CONFIG-SETUP.md)**         | Quick overview of config system           | 5 min     |
| **[ENV-VARIABLES.md](./ENV-VARIABLES.md)**       | Comprehensive environment variables guide | 15 min    |
| **[SETUP-COMPARISON.md](./SETUP-COMPARISON.md)** | Compare manual vs auto-generation         | 8 min     |

### Xcode Build Automation

| Document                                           | Description                             | Read Time |
| -------------------------------------------------- | --------------------------------------- | --------- |
| **[QUICK-SETUP-XCODE.md](./QUICK-SETUP-XCODE.md)** | Visual step-by-step guide (recommended) | 10 min    |
| **[XCODE-BUILD-PHASE.md](./XCODE-BUILD-PHASE.md)** | Detailed Xcode build phase guide        | 20 min    |

---

## 🎯 Choose Your Path

### Path 1: Get Running Quickly (Recommended for Solo Developers)

```
1. Read: README.md
2. Read: CONFIG-SETUP.md
3. Run: yarn generate-config
4. Build in Xcode
✅ Done in 15 minutes
```

### Path 2: Full Setup with Auto-Generation (Recommended for Teams)

```
1. Read: README.md
2. Read: CONFIG-SETUP.md
3. Read: QUICK-SETUP-XCODE.md
4. Setup Xcode build phase
5. Build in Xcode
✅ Done in 20 minutes, saves time forever
```

### Path 3: Deep Understanding (For Power Users)

```
1. Read all documentation in order
2. Understand manual and automated workflows
3. Choose best setup for your needs
4. Configure multi-environment support
✅ Master-level setup in 1 hour
```

---

## 📚 Documentation by Topic

### 🔧 Configuration

- How environment variables work → [ENV-VARIABLES.md](./ENV-VARIABLES.md)
- Quick config setup → [CONFIG-SETUP.md](./CONFIG-SETUP.md)
- Simulator vs Device detection → [CONFIG-SETUP.md](./CONFIG-SETUP.md#how-it-works)

### 🤖 Automation

- Auto-generate on every build → [QUICK-SETUP-XCODE.md](./QUICK-SETUP-XCODE.md)
- Xcode build phases explained → [XCODE-BUILD-PHASE.md](./XCODE-BUILD-PHASE.md)
- CI/CD integration → [SETUP-COMPARISON.md](./SETUP-COMPARISON.md#cicd-considerations)

### 👥 Team Workflow

- Manual vs auto comparison → [SETUP-COMPARISON.md](./SETUP-COMPARISON.md)
- Team recommendations → [SETUP-COMPARISON.md](./SETUP-COMPARISON.md#team-recommendations)
- New developer onboarding → [XCODE-BUILD-PHASE.md](./XCODE-BUILD-PHASE.md#team-setup)

### 🚀 Advanced Topics

- Multiple environments (dev/staging/prod) → [ENV-VARIABLES.md](./ENV-VARIABLES.md#advanced-multiple-environments)
- Conditional generation → [XCODE-BUILD-PHASE.md](./XCODE-BUILD-PHASE.md#advanced-conditional-generation)
- Custom IP detection → [ENV-VARIABLES.md](./ENV-VARIABLES.md#troubleshooting)

### 🆘 Troubleshooting

- Common issues → [ENV-VARIABLES.md](./ENV-VARIABLES.md#troubleshooting)
- Build phase problems → [XCODE-BUILD-PHASE.md](./XCODE-BUILD-PHASE.md#troubleshooting)
- Network issues → [CONFIG-SETUP.md](./CONFIG-SETUP.md#important-notes)

---

## 🎓 Learning Resources

### Concepts to Understand

1. **Environment Variables**
   - What they are and why we use them
   - Read: [ENV-VARIABLES.md](./ENV-VARIABLES.md#overview)

2. **Build-Time vs Runtime**
   - Why iOS uses build-time generation
   - Read: [ENV-VARIABLES.md](./ENV-VARIABLES.md#how-it-works)

3. **Simulator vs Device**
   - Network differences and localhost vs IP
   - Read: [CONFIG-SETUP.md](./CONFIG-SETUP.md#how-it-works)

4. **Xcode Build Phases**
   - What they are and execution order
   - Read: [XCODE-BUILD-PHASE.md](./XCODE-BUILD-PHASE.md)

---

## 🔍 Find What You Need

### "How do I...?"

**...get started quickly?**
→ Read [CONFIG-SETUP.md](./CONFIG-SETUP.md)

**...set up auto-generation?**
→ Follow [QUICK-SETUP-XCODE.md](./QUICK-SETUP-XCODE.md)

**...understand how it works?**
→ Read [ENV-VARIABLES.md](./ENV-VARIABLES.md)

**...compare manual vs auto?**
→ Read [SETUP-COMPARISON.md](./SETUP-COMPARISON.md)

**...fix build errors?**
→ Check troubleshooting in [XCODE-BUILD-PHASE.md](./XCODE-BUILD-PHASE.md#troubleshooting)

**...set up multiple environments?**
→ See advanced section in [ENV-VARIABLES.md](./ENV-VARIABLES.md#advanced-multiple-environments)

---

## 📋 Complete File List

### Documentation Files

```
ios-app/
├── README.md                       # Project overview
├── SETUP.md                        # Initial setup
├── INDEX.md                        # This file (documentation index)
├── CONFIG-SETUP.md                 # Config quick start ⭐
├── ENV-VARIABLES.md                # Comprehensive env guide
├── SETUP-COMPARISON.md             # Manual vs auto comparison
├── QUICK-SETUP-XCODE.md           # Visual Xcode guide ⭐
└── XCODE-BUILD-PHASE.md           # Detailed build phase guide
```

⭐ = **Recommended starting points**

### Script Files

```
ios-app/scripts/
├── generate-config.sh              # Main config generation script
├── generate-swift-models.mjs       # Model generation (existing)
└── setup-xcode-build-phase.sh     # Automated Xcode setup (advanced)
```

### Config Files

```
ios-app/CheerioApp/
├── Config.swift                    # Generated config (gitignored)
└── Config.swift.example           # Template (safe to commit)
```

---

## 🎯 Reading Order

### Minimal (15 minutes)

1. CONFIG-SETUP.md
2. Run `yarn generate-config`
3. Build

### Recommended (30 minutes)

1. CONFIG-SETUP.md
2. SETUP-COMPARISON.md
3. QUICK-SETUP-XCODE.md
4. Setup and build

### Complete (1 hour)

1. CONFIG-SETUP.md
2. ENV-VARIABLES.md
3. SETUP-COMPARISON.md
4. QUICK-SETUP-XCODE.md
5. XCODE-BUILD-PHASE.md
6. Setup, customize, build

---

## 💡 Tips

- 📌 **Bookmark this page** - Use it as your navigation hub
- 🔖 **Start with starred docs** - CONFIG-SETUP.md and QUICK-SETUP-XCODE.md
- 🎯 **Skip what you don't need** - Not everyone needs auto-generation
- 📚 **Come back later** - Advanced topics can wait until you need them
- 💬 **Share with team** - Send them directly to QUICK-SETUP-XCODE.md

---

## 🆘 Still Need Help?

1. **Check Troubleshooting** sections in relevant docs
2. **Verify .env.local** exists and has required values
3. **Clean Xcode build** folder (Cmd+Shift+K)
4. **Review build log** for specific error messages
5. **Check that scripts are executable**: `chmod +x scripts/*.sh`

---

## 📝 Document Summaries

### CONFIG-SETUP.md

**Summary**: Quick overview of the config system, how it works, benefits, and basic usage.
**Best for**: Everyone - start here
**Time**: 5 minutes

### ENV-VARIABLES.md

**Summary**: Comprehensive guide covering all environment variables, supported formats, security, troubleshooting, and advanced multi-environment setup.
**Best for**: Deep understanding, advanced configurations
**Time**: 15 minutes

### SETUP-COMPARISON.md

**Summary**: Compares manual vs auto-generation workflows with tables, recommendations by team size, and CI/CD considerations.
**Best for**: Choosing the right approach for your team
**Time**: 8 minutes

### QUICK-SETUP-XCODE.md

**Summary**: Visual step-by-step guide with ASCII art showing exactly how to set up auto-generation in Xcode.
**Best for**: First-time Xcode build phase setup
**Time**: 10 minutes

### XCODE-BUILD-PHASE.md

**Summary**: Detailed guide covering Xcode build phases, input/output files, conditional generation, multiple environments, and team setup.
**Best for**: Complete understanding, troubleshooting, advanced scenarios
**Time**: 20 minutes

---

## ✅ Checklist

Use this to track your progress:

- [ ] Read README.md
- [ ] Read CONFIG-SETUP.md
- [ ] Created .env.local file
- [ ] Ran `yarn generate-config` successfully
- [ ] Built app in Xcode successfully
- [ ] (Optional) Read SETUP-COMPARISON.md
- [ ] (Optional) Set up auto-generation in Xcode
- [ ] (Optional) Read advanced topics

---

Happy coding! 🎉
