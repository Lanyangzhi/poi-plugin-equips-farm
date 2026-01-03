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

### 更新日志

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

### Changelog

#### v4.2.1
- ✨ Added multi-language search support (Chinese, Japanese, Hiragana, Romaji)
- 🔧 Improved notification format to display ship and equipment names
- 🐛 Fixed WCTF data structure access issues
- 🧹 Cleaned up unused i18n dependencies

### License

MIT License
