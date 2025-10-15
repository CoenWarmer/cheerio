# Setup Methods Comparison

Choose the best setup method for your workflow:

## 📊 Comparison Table

| Feature             | Manual Generation                            | Auto-Generate on Build       |
| ------------------- | -------------------------------------------- | ---------------------------- |
| **Setup Time**      | None (ready to use)                          | 5 minutes one-time           |
| **When to Run**     | Run `yarn generate-config` when .env changes | Automatic on every build     |
| **Team Setup**      | Everyone runs command                        | Xcode project includes setup |
| **Forgetting Risk** | ⚠️ Can forget to regenerate                  | ✅ Never forget              |
| **Build Speed**     | Faster (no script)                           | Slightly slower (~1 second)  |
| **Flexibility**     | Full control when to regenerate              | Automatic, less control      |
| **Best For**        | Solo dev, infrequent changes                 | Teams, frequent changes      |
| **CI/CD**           | Requires manual step                         | Can be automated             |

---

## 🎯 Which Should You Choose?

### Choose **Manual Generation** if:

- ✅ You're the only developer
- ✅ Your .env.local rarely changes
- ✅ You want faster builds
- ✅ You prefer explicit control
- ✅ You're comfortable running terminal commands

**Command:**

```bash
yarn generate-config
```

### Choose **Auto-Generate on Build** if:

- ✅ You work in a team
- ✅ Multiple developers use the iOS app
- ✅ Your .env.local changes frequently
- ✅ You want to avoid mistakes
- ✅ You prefer "set it and forget it"
- ✅ New team members should get auto-setup

**Setup:** See [QUICK-SETUP-XCODE.md](./QUICK-SETUP-XCODE.md)

---

## 🔄 Workflow Comparison

### Manual Generation Workflow

```
Day 1:
├─ Clone repo
├─ Copy .env.local
├─ yarn generate-config  ← Manual
└─ Build in Xcode

Day 2 (changed .env):
├─ Edit .env.local
├─ yarn generate-config  ← Must remember!
└─ Build in Xcode

Day 3:
├─ Edit .env.local
├─ Forget to run generate-config  ⚠️
└─ Build with outdated config  ❌
```

### Auto-Generate Workflow

```
Day 1:
├─ Clone repo
├─ Copy .env.local
├─ Setup Xcode build phase (one-time, 5 min)
└─ Build in Xcode → Config auto-generates ✅

Day 2 (changed .env):
├─ Edit .env.local
└─ Build in Xcode → Config auto-generates ✅

Day 3:
├─ Edit .env.local
└─ Build in Xcode → Config auto-generates ✅
```

---

## 💡 Hybrid Approach (Best of Both)

You can use **both** methods:

1. **Set up auto-generation** in Xcode (for safety)
2. **Run manual command** when you want immediate regeneration without building

```bash
# Immediate regeneration (without building)
yarn generate-config

# Or just build - it will auto-generate
# (Cmd+B in Xcode)
```

---

## 🏢 Team Recommendations

### Small Team (1-3 developers)

**Recommendation**: Manual generation  
**Why**: Simple, less overhead, easy to coordinate

### Medium Team (4-10 developers)

**Recommendation**: Auto-generate on build  
**Why**: Reduces coordination, prevents mistakes

### Large Team (10+ developers)

**Recommendation**: Auto-generate on build + CI/CD  
**Why**: Consistent across all environments

---

## 🚀 CI/CD Considerations

### Manual Generation

```yaml
# GitHub Actions example
- name: Generate iOS Config
  run: |
    cd packages/ios-app
    yarn generate-config

- name: Build iOS App
  run: xcodebuild ...
```

### Auto-Generate on Build

```yaml
# GitHub Actions example
- name: Build iOS App
  run: xcodebuild ... # Config auto-generates
```

**Advantage**: Auto-generate works seamlessly in CI/CD without extra steps.

---

## 📈 Performance Impact

### Build Time Comparison

```
Manual Generation:
Build time: ~10 seconds (baseline)

Auto-Generate on Build (without caching):
Build time: ~11 seconds (+1 second for script)

Auto-Generate on Build (with input/output files):
Build time: ~10.1 seconds (only regenerates if .env changed)
```

**Verdict**: Negligible impact, especially with caching configured.

---

## 🎓 Learning Curve

### Manual Generation

```
Complexity: ⭐☆☆☆☆ (Very Easy)
Setup: None
Training: "Run yarn generate-config when .env changes"
```

### Auto-Generate on Build

```
Complexity: ⭐⭐☆☆☆ (Easy)
Setup: 5 minutes one-time
Training: "Config auto-updates, don't worry about it"
```

---

## 🔐 Security Considerations

Both methods are equally secure:

- ✅ `.env.local` is gitignored
- ✅ Generated `Config.swift` is gitignored
- ✅ Credentials never committed to repo
- ✅ Each developer has own `.env.local`

**Note**: For production deployments, use environment-specific configs. See [ENV-VARIABLES.md](./ENV-VARIABLES.md) for multi-environment setup.

---

## 🆘 Troubleshooting by Method

### If using Manual Generation and having issues:

1. Did you run `yarn generate-config`?
2. Is `.env.local` in the right location?
3. Does it have required variables?

### If using Auto-Generate and having issues:

1. Is the script phase in Build Phases?
2. Is it **above** "Compile Sources"?
3. Is the script executable? (`chmod +x`)
4. Check build log for error messages

---

## 🎯 Summary

**TL;DR**:

- **Just you?** → Manual generation is fine
- **Working with others?** → Set up auto-generation
- **Not sure?** → Start manual, switch to auto later

Both methods use the same underlying script, so switching is easy!

---

## 📚 Next Steps

- **Manual Setup**: Just run `yarn generate-config`
- **Auto Setup**: Follow [QUICK-SETUP-XCODE.md](./QUICK-SETUP-XCODE.md)
- **More Info**: Read [ENV-VARIABLES.md](./ENV-VARIABLES.md)
