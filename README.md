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

本插件使用 [WhoCallsTheFleet (WCTF)](https://github.com/TeamFleet/WhoCallsTheFleet) 数据库提供装备获取信息和多语言名称支持。

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

仓库内置了一个 GitHub Actions 工作流，用于跟踪上游 `yukikuri/akashi-list` 的提交变化，并自动刷新 `initial_equip_ships.json`。

- 工作流文件：`.github/workflows/sync-akashi-data.yml`
- 默认上游仓库：`yukikuri/akashi-list`
- 触发方式：
  - 定时执行
  - GitHub Actions 页面手动执行
- 核心逻辑：
  - 先检查上游最新 commit hash
  - 如果 hash 没变，直接退出
  - 如果 hash 变了，重新生成 `initial_equip_ships.json`
  - 如果数据内容有变化，自动升级 patch 版本、提交并打 tag
  - tag 推送后，会触发 `.github/workflows/npm-publish.yml` 自动发布 npm
  - 如果上游 hash 变了但数据内容没变，只记录新的 hash，不发版

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

This plugin uses the [WhoCallsTheFleet (WCTF)](https://github.com/TeamFleet/WhoCallsTheFleet) database for equipment acquisition information and multi-language name support.

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

This repository includes a GitHub Actions workflow that tracks upstream changes from `yukikuri/akashi-list` and refreshes `initial_equip_ships.json` automatically.

- Workflow file: `.github/workflows/sync-akashi-data.yml`
- Default upstream repository: `yukikuri/akashi-list`
- Trigger modes:
  - Scheduled run
  - Manual run from GitHub Actions
- Core flow:
  - Check the latest upstream commit hash first
  - Exit immediately if the hash did not change
  - Regenerate `initial_equip_ships.json` if the hash changed
  - If the generated data changed, bump the patch version, commit, and tag
  - The new tag then triggers `.github/workflows/npm-publish.yml` to publish to npm
  - If upstream changed but the generated data did not, only record the new hash without publishing

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
