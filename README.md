# 装备养殖助手 / Equipment Farming Assistant

由Antigravity强力驱动
Coding by Antigravity

一个帮助舰队Collection玩家追踪和养殖特定装备的 POI 插件。

A POI plugin to assist Kantai Collection players in tracking and farming specific equipment from ship remodels.

[English](#english) | [中文](#中文)

---

## 中文

### 功能特性

- 📋 **装备追踪**: 设置需要养殖的装备目标数量
- 🚢 **舰娘信息**: 查看哪些舰娘可以提供目标装备及其改造等级
- 📊 **进度显示**: 实时显示当前拥有量与目标数量的对比
- 🔔 **掉落提醒**: 当获得有用的舰娘时自动弹出提示（格式：🔒{舰娘}可获得{装备}⚙️）
- 🔍 **多语言搜索**: 支持中文、日文、平假名、罗马音搜索
  - 中文：五十铃、长门
  - 日文：五十鈴、長門
  - 平假名：いすず、ながと
  - 罗马音：isuzu、nagato
- 🎯 **智能过滤**: 按装备类型、名称、标记状态筛选
- 💾 **自动保存**: 目标设置自动保存，重启后保留

### 安装方法

#### 方法一：通过 NPM（推荐）
```bash
npm install poi-plugin-equips-farm
```

#### 方法二：通过 POI 插件商店
1. 打开 POI
2. 进入 设置 → 插件
3. 搜索 "poi-plugin-equips-farm"
4. 点击安装

#### 方法三：手动安装
1. 下载最新版本的插件
2. 解压到 POI 插件目录：
   - Windows: `%APPDATA%\poi\plugins\node_modules\`
   - macOS/Linux: `~/.config/poi/plugins/node_modules/`
3. 重启 POI

### 使用说明

#### 1. 设置目标装备
- 在"Equipments"标签页中找到需要的装备
- 使用 `+` `-` 按钮或直接输入数字设置目标数量
- 点击装备可展开查看提供该装备的舰娘列表

#### 2. 查看舰娘
- 切换到"Ships"标签页
- 查看每艘舰娘可以提供哪些装备
- 按改造等级排序显示

#### 3. 搜索功能
- **装备搜索**：支持中文、日文、罗马音
  - 示例：搜索 "12cm单装炮" 或 "12cm単装砲" 或 "tansouhou"
- **舰娘搜索**：支持中文、日文、平假名、罗马音
  - 示例：搜索 "五十铃" 或 "五十鈴" 或 "いすず" 或 "isuzu"

#### 4. 过滤功能
- 使用搜索框按名称筛选
- 点击装备类型图标筛选特定类型
- 使用 All/Marked/Unmarked 切换显示状态

### 数据来源

本插件从多个数据源构建"舰娘 → 可提供装备"映射，任意数据源缺失都不会导致列表为空：

| 数据源 | 说明 |
|---|---|
| **WCTF 数据库** | [WhoCallsTheFleet](https://github.com/TeamFleet/WhoCallsTheFleet) 数据库，由 poi 在 设置 → 关于 → 更新 页面按需安装/更新（npm 包 `whocallsthefleet-database`）。提供舰娘自带装备（改造获得）与改造链信息 |
| **游戏主数据** | poi 的 `const.$ships`，登录并加载游戏数据后可用，提供 `api_aftershipid` 改造链与日文名称 |
| **本地缓存** | `%APPDATA%\poi\poi-plugin-equips-farm\master_cache.json`，由游戏 `api_start2` 响应自动写入（原子写入，损坏自动清除并重建） |
| **内置数据** | 随插件发布的 `initial_equip_ships.json`（Akashi 数据，定期自动同步），提供初始装备信息 |

### 常见问题排查

#### 提示 "未检测到装备数据" / 列表为空（旧版本为 "No items match filter"）

列表为空说明**所有数据源都不可用**，常见原因与解决方法：

1. **WCTF 数据库未加载**（最常见）
   - 打开 poi：设置 → 关于 → 更新，点击 WCTF 数据库旁的更新按钮
   - 若更新失败，多为网络问题，请检查到 npm registry 的连通性
2. **游戏数据未加载**
   - 确认已进入游戏并完成数据加载（`api_start2`），再打开插件面板
   - 若在未登录状态打开插件，面板会显示空列表，登录后自动恢复
3. **本地缓存损坏**
   - 插件会自动检测并删除损坏的缓存文件，下次进入游戏时自动重建，无需手动处理
4. **数据源状态诊断**
   - 空列表状态下会显示"数据源状态"面板（WCTF / 游戏主数据 / 本地缓存 / 内置数据 各自的状态与数量）
   - 点击"重新加载"按钮可强制重建数据
   - 若问题仍存在，请截图该面板反馈给开发者，可快速定位原因

> 提示：重新安装插件不会清除上述数据（它们位于 poi 的配置/数据目录中），如果重装后问题依旧，请优先检查 WCTF 数据库与游戏数据加载状态。

### 开发

```bash
# 克隆仓库
git clone https://github.com/Lanyangzhi/poi-plugin-equips-farm.git
cd poi-plugin-equips-farm

# 安装依赖
npm install

# 链接到 POI 插件目录（Windows）
cd %APPDATA%\poi\plugins\node_modules
mklink /J poi-plugin-equips-farm "D:\path\to\poi-plugin-equips-farm"

# 链接到 POI 插件目录（macOS/Linux）
cd ~/.config/poi/plugins/node_modules
ln -s /path/to/poi-plugin-equips-farm poi-plugin-equips-farm

# 重启 POI 进行测试
```

### 自动同步 Akashi 数据

仓库内置了一个 GitHub Actions 工作流，用于跟踪上游 `yukikuri/akashi-list` 的提交变化，自动刷新 `initial_equip_ships.json` 并发布到 npm。

- 工作流文件：`.github/workflows/sync-akashi-data.yml`
- 默认上游仓库：`yukikuri/akashi-list`
- 触发方式：
  - 定时执行（每天 03:17 UTC）
  - GitHub Actions 页面手动执行
- 核心逻辑（单 workflow 双 job，全链路自动完成，无需人工干预）：
  - **job `sync-data`**：检查上游最新 commit hash → 重新生成 `initial_equip_ships.json` → **数据有效性校验**（解析出的装备条目数 ≥ 100，防止上游改版导致发布空数据）→ 数据有变化时自动 `npm version patch` → 提交（数据 + package.json + hash）→ 打 tag → push
  - **job `publish`**（依赖 sync-data，仅数据变化时执行）：`npm test` → `npm publish --provenance`（OIDC trusted publishing，无需 token）
  - 如果上游 hash 变了但数据内容没变，只记录新的 hash，不发版
  - `concurrency` 串行控制：定时任务与手动触发并发时不会产生重复版本号
- 发布失败处理：在 GitHub Actions 页面直接 "Re-run failed jobs" 即可重试发布（数据与版本号已就绪）
- 手动兜底：`.github/workflows/npm-publish.yml` 支持 `workflow_dispatch` 手动发布当前 master 版本

> 注意：tag 推送（使用默认 `GITHUB_TOKEN`）不会触发其他 workflow（GitHub 递归保护），因此发布与数据同步在**同一个 workflow** 内完成，不依赖跨 workflow 触发。

#### Node.js / npm 版本维护

发布环境固定使用 **Node.js 24（LTS）+ npm@12**：

- `actions/setup-node` 指定 `node-version: 24`（自动使用最新的 24.x，始终满足 npm@12 的 engine 要求）
- `npm install -g npm@12` **锁定 npm 大版本**，不使用 `npm@latest`
  - npm@latest 是滚动版本，新 major 会不断提高 engine 要求（如 npm@12 要求 node ≥ 22.22.2），导致镜像自带 node 版本不匹配（`EBADENGINE`）
  - npm registry 永久保留所有历史版本，npm@12 的 OIDC/provenance 支持（npm ≥ 9.7 引入）长期有效
- 如需升级 npm 大版本：先确认目标 npm 的 `engines` 要求，再同步调整 `node-version`

#### 需要的 GitHub 配置

- `Secrets`
  - `NPM_TOKEN`
    - 用于自动执行 `npm publish`
- `Variables`（可选）
  - `AKASHI_REPO`
    - 可覆盖默认上游仓库
    - 默认值已经是 `yukikuri/akashi-list`
    - 只有在你想切到自己的 mirror/fork 时才需要设置

#### 手动执行

可以在 GitHub Actions 页面手动运行 `Sync Akashi Data`。

- 默认会使用 `yukikuri/akashi-list`
- 如果需要临时切换上游仓库，可以在 `workflow_dispatch` 输入框里填写 `akashi_repo`

#### 本地手动生成

```bash
# 使用仓库内置的旧路径
npm run extract:akashi

# 使用外部 akashi-list 源目录
npm run extract:akashi:external -- D:\VibeCoding\akashi-list
```

### 更新日志

#### v1.0.15
- 🐛 **修复 "No items match filter" 空列表问题**: 移除对 WCTF 数据的强依赖，改为多数据源合并构建（游戏主数据 / 本地缓存 / 内置 Akashi 数据），任意数据源缺失或损坏时列表仍可用
- 🔧 **名称匹配归一化**: 忽略大小写与空格差异（如 `Bismarck zwei` 与 `Bismarck Zwei`），支持中/日/罗马音变体
- 💾 **本地缓存加固**: 原子写入（防止崩溃损坏）、读取校验、损坏文件自动清除并重建
- 🩺 **诊断面板**: 列表为空时显示各数据源状态与"重新加载"按钮，便于定位问题
- 🎛️ **筛选优化**: 空结果时提供"清除筛选"按钮；类型过滤支持一键清除
- 🌐 **i18n 双语界面**: 支持中/英文界面（跟随 poi 语言设置），替换原有英文硬编码
- 🐛 **修复**: 罗马音转换中长音符（ー）与促音（っ）未生效的问题
- ✅ **新增测试**: `npm test` 覆盖数据源缺失回归、名称匹配、缓存自愈等核心逻辑

#### v1.0.11
- 🔧 在 GitHub Actions 发布流程中显式升级 npm 到最新版本，以修复 trusted publishing 场景下的 `E404` 发布失败

#### v1.0.10
- 🧪 临时简化 npm 发布 workflow，移除 provenance 参数以排查 trusted publishing 发布失败问题

#### v1.0.9
- 🔄 自动跟随上游（`yukikuri/akashi-list`）更新 `initial_equip_ships.json`
- 🤖 新增 GitHub Actions 自动同步与自动发版流程
- ⚙️ 优化 trusted publishing 配置，准备通过 GitHub Actions 自动发布 npm

#### v1.0.4
- 🏗️ **重构数据架构**: 引入 Block 1-2-3 三层数据体系，彻底解决新船数据滞后问题。
- ⚡ **本地缓存支持**: 自动缓存游戏 `api_start2` 数据（Block 2），确保舰娘改名、新实装舰娘能即时被插件识别。
- 🔄 **外部数据挂载**: 支持通过 `initial_equip_ships.json`（Block 3）补充初始装备数据，即使 WCTF 尚未收录也能正确显示名字和头像。
- 🐛 **修复**: 修复了因新船数据缺失导致的插件崩溃或“空白”显示问题。

#### v4.2.1
- ✨ 新增多语言搜索支持（中文、日文、平假名、罗马音）
- 🔧 优化通知格式，显示舰娘和装备名称
- 🐛 修复 WCTF 数据结构访问问题
- 🧹 清理未使用的 i18n 依赖

### 许可证

MIT License

---

## English

### Features

- 📋 **Equipment Tracking**: Set target quantities for equipment you want to farm
- 🚢 **Ship Information**: View which ships provide target equipment and their remodel levels
- 📊 **Progress Display**: Real-time comparison of current inventory vs target quantity
- 🔔 **Drop Notifications**: Automatic alerts when you acquire useful ships (Format: 🔒{ship}可获得{equipment}⚙️)
- 🔍 **Multi-language Search**: Search in Chinese, Japanese, Hiragana, and Romaji
  - Chinese: 五十铃, 长门
  - Japanese: 五十鈴, 長門
  - Hiragana: いすず, ながと
  - Romaji: isuzu, nagato
- 🎯 **Smart Filtering**: Filter by equipment type, name, or marked status
- 💾 **Auto-save**: Target settings are automatically saved and persist across restarts

### Installation

#### Method 1: Via NPM (Recommended)
```bash
npm install poi-plugin-equips-farm
```

#### Method 2: Via POI Plugin Store
1. Open POI
2. Go to Settings → Plugins
3. Search for "poi-plugin-equips-farm"
4. Click Install

#### Method 3: Manual Installation
1. Download the latest release
2. Extract to POI plugins directory:
   - Windows: `%APPDATA%\poi\plugins\node_modules\`
   - macOS/Linux: `~/.config/poi/plugins/node_modules/`
3. Restart POI

### Usage

#### 1. Set Target Equipment
- Find the equipment you need in the "Equipments" tab
- Use `+` `-` buttons or type directly to set target quantity
- Click on equipment to expand and view ships that provide it

#### 2. View Ships
- Switch to "Ships" tab
- See what equipment each ship can provide
- Sorted by remodel level

#### 3. Search Functionality
- **Equipment Search**: Supports Chinese, Japanese, and Romaji
  - Example: Search "12cm单装炮" or "12cm単装砲" or "tansouhou"
- **Ship Search**: Supports Chinese, Japanese, Hiragana, and Romaji
  - Example: Search "五十铃" or "五十鈴" or "いすず" or "isuzu"

#### 4. Filtering
- Use search box to filter by name
- Click equipment type icons to filter by type
- Use All/Marked/Unmarked to toggle display status

### Data Source

The plugin builds its "ship → provides equipment" map from multiple sources, so a missing source never empties the list:

| Source | Description |
|---|---|
| **WCTF Database** | [WhoCallsTheFleet](https://github.com/TeamFleet/WhoCallsTheFleet) database, installed/updated by poi on demand on the Settings → About → Update page (npm package `whocallsthefleet-database`). Provides stock equipment (from remodels) and remodel chains |
| **Game Master Data** | poi's `const.$ships`, available after logging in with game data loaded. Provides `api_aftershipid` remodel chains and Japanese names |
| **Local Cache** | `%APPDATA%\poi\poi-plugin-equips-farm\master_cache.json`, written automatically from game `api_start2` responses (atomic write; corrupted files are auto-removed and rebuilt) |
| **Bundled Data** | `initial_equip_ships.json` shipped with the plugin (Akashi data, auto-synced regularly), providing initial equipment |

### Troubleshooting

#### "No equipment data detected" / empty list (old versions: "No items match filter")

An empty list means **all data sources are unavailable**. Common causes and fixes:

1. **WCTF database not loaded** (most common)
   - Open poi: Settings → About → Update, click the update button next to the WCTF database
   - If the update fails, check network access to the npm registry
2. **Game data not loaded**
   - Make sure you are logged in with game data loaded (`api_start2`) before opening the plugin panel
   - If the panel is opened while logged out, the list is empty and recovers automatically after login
3. **Local cache corrupted**
   - The plugin detects and removes corrupted cache files automatically; they are rebuilt on the next game login. No manual action needed
4. **Data source diagnostics**
   - When the list is empty, a "Data source status" panel shows the state and counts of WCTF / game master data / local cache / bundled data
   - Click the "Reload" button to force a rebuild
   - If the issue persists, screenshot this panel when reporting the bug for faster diagnosis

> Note: reinstalling the plugin does NOT clear these data (they live in poi's config/data directories). If the problem survives a reinstall, check the WCTF database and game data loading first.

### Development

```bash
# Clone repository
git clone https://github.com/Lanyangzhi/poi-plugin-equips-farm.git
cd poi-plugin-equips-farm

# Install dependencies
npm install

# Link to POI plugins directory (Windows)
cd %APPDATA%\poi\plugins\node_modules
mklink /J poi-plugin-equips-farm "D:\path\to\poi-plugin-equips-farm"

# Link to POI plugins directory (macOS/Linux)
cd ~/.config/poi/plugins/node_modules
ln -s /path/to/poi-plugin-equips-farm poi-plugin-equips-farm

# Restart POI for testing
```

### Automatic Akashi Data Sync

This repository includes a GitHub Actions workflow that tracks upstream changes from `yukikuri/akashi-list`, refreshes `initial_equip_ships.json` and publishes to npm automatically.

- Workflow file: `.github/workflows/sync-akashi-data.yml`
- Default upstream repository: `yukikuri/akashi-list`
- Trigger modes:
  - Scheduled run (every day at 03:17 UTC)
  - Manual run from GitHub Actions
- Core flow (single workflow, two jobs; fully automatic, no manual steps):
  - **job `sync-data`**: check the latest upstream commit hash → regenerate `initial_equip_ships.json` → **data validation** (extracted equipment count must be >= 100, to avoid publishing empty data if the upstream HTML format changes) → auto `npm version patch` when data changed → commit (data + package.json + hash) → tag → push
  - **job `publish`** (depends on sync-data, runs only when data changed): `npm test` → `npm publish --provenance` (OIDC trusted publishing, no token required)
  - If upstream changed but the generated data did not, only the new hash is committed without publishing
  - `concurrency` group serializes runs so schedule + manual dispatch can never produce duplicate versions
- On publish failure: use "Re-run failed jobs" on the GitHub Actions page (data and version are already in place)
- Manual fallback: `.github/workflows/npm-publish.yml` supports `workflow_dispatch` to publish the current master version

> Note: tag pushes made with the default `GITHUB_TOKEN` do NOT trigger other workflows (GitHub recursion protection), so publishing happens inside the same workflow as the data sync instead of relying on cross-workflow triggers.

#### Node.js / npm version policy

The publish environment is pinned to **Node.js 24 (LTS) + npm@12**:

- `actions/setup-node` uses `node-version: 24` (resolves to the latest 24.x, always satisfying npm@12's engine requirements)
- `npm install -g npm@12` **pins the npm major version** instead of using `npm@latest`
  - `npm@latest` rolls forward; new majors keep raising engine requirements (e.g. npm@12 requires node >= 22.22.2), which breaks the runner's bundled node (`EBADENGINE`)
  - The npm registry keeps every historical version forever; npm@12's OIDC/provenance support (introduced in npm >= 9.7) is stable long-term
- To upgrade the npm major later: first check the target npm's `engines` requirement, then adjust `node-version` accordingly

#### Required GitHub Setup

- `Secrets`
  - `NPM_TOKEN`
    - Required for automatic `npm publish`
- `Variables` (optional)
  - `AKASHI_REPO`
    - Overrides the default upstream repository
    - The workflow already defaults to `yukikuri/akashi-list`
    - Only needed if you want to switch to your own mirror or fork later

#### Manual Run

You can manually run `Sync Akashi Data` from the GitHub Actions page.

- By default it uses `yukikuri/akashi-list`
- If needed, you can override the source with the `akashi_repo` workflow input

#### Local Generation

```bash
# Use the repository's bundled Akashi copy
npm run extract:akashi

# Use an external akashi-list source directory
npm run extract:akashi:external -- D:\VibeCoding\akashi-list
```

### Changelog

#### v1.0.15
- 🐛 **Fix "No items match filter" empty list**: removed the hard dependency on WCTF data; the map is now merged from multiple sources (game master data / local cache / bundled Akashi data), so a missing or corrupted source no longer empties the list
- 🔧 **Normalized name matching**: case/whitespace-insensitive (e.g. `Bismarck zwei` vs `Bismarck Zwei`), with Chinese/Japanese/Romaji variants
- 💾 **Hardened local cache**: atomic writes (crash-safe), read validation, corrupted files auto-removed and rebuilt
- 🩺 **Diagnostics panel**: when the list is empty, each data source's status is shown with a "Reload" button for faster troubleshooting
- 🎛️ **Filter UX**: "Clear filters" action when a filter empties the list; one-click clear for type filters
- 🌐 **i18n bilingual UI**: Chinese/English interface (follows poi language), replacing hardcoded English strings
- 🐛 **Fix**: long vowel mark (ー) and small tsu (っ) were not dropped in Romaji conversion
- ✅ **Tests**: `npm test` covers the no-data regression, name matching, and cache self-healing

#### v1.0.11
- 🔧 Explicitly upgrade npm to the latest version in GitHub Actions to fix trusted publishing `E404` publish failures

#### v1.0.10
- 🧪 Temporarily simplified the npm publish workflow by removing the provenance flag to isolate the trusted publishing failure

#### v1.0.9
- 🔄 Automatically follow upstream (`yukikuri/akashi-list`) updates for `initial_equip_ships.json`
- 🤖 Added GitHub Actions automation for data sync and release publishing
- ⚙️ Updated trusted publishing setup to support GitHub Actions npm releases

#### v4.2.1
- ✨ Added multi-language search support (Chinese, Japanese, Hiragana, Romaji)
- 🔧 Improved notification format to display ship and equipment names
- 🐛 Fixed WCTF data structure access issues
- 🧹 Cleaned up unused i18n dependencies

### License

MIT License
