# 装备养殖助手 / Equipment Farming Assistant

一个帮助舰队Collection玩家追踪和养殖特定装备的 POI 插件。

[English](#english) | [中文](#中文)

---

## 中文

### 功能特性

- 📋 **装备追踪**: 设置需要养殖的装备目标数量
- 🚢 **舰娘信息**: 查看哪些舰娘可以提供目标装备及其改造等级
- 📊 **进度显示**: 实时显示当前拥有量与目标数量的对比
- 🔔 **掉落提醒**: 当获得有用的舰娘时自动弹出提示
- 🔍 **智能过滤**: 按装备类型、名称、标记状态筛选
- 💾 **自动保存**: 目标设置自动保存，重启后保留

### 安装方法

#### 方法一：通过 POI 插件商店（推荐）
1. 打开 POI
2. 进入 设置 → 插件
3. 搜索 "Farming Assistant" 或 "装备养殖"
4. 点击安装

#### 方法二：手动安装
1. 下载最新版本的插件
2. 解压到 POI 插件目录：
   - Windows: `%APPDATA%\poi\plugins\node_modules\`
   - macOS/Linux: `~/.config/poi/plugins/node_modules/`
3. 重启 POI

### 使用说明

1. **设置目标装备**
   - 在"装备"标签页中找到需要的装备
   - 使用 `+` `-` 按钮或直接输入数字设置目标数量
   - 点击装备可展开查看提供该装备的舰娘列表

2. **查看舰娘**
   - 切换到"舰娘"标签页
   - 查看每艘舰娘可以提供哪些装备
   - 按改造等级排序显示

3. **过滤功能**
   - 使用搜索框按名称筛选
   - 点击装备类型图标筛选特定类型
   - 使用 All/Marked/Unmarked 切换显示状态

### 数据来源

本插件使用 [WhoCallsTheFleet (WCTF)](https://github.com/TeamFleet/WhoCallsTheFleet) 数据库提供装备获取信息。

### 开发

```bash
# 克隆仓库
git clone https://github.com/Lanyangzhi/poi-plugin-equips-farm.git

# 链接到 POI 插件目录
cd %APPDATA%\poi\plugins\node_modules
mklink /J poi-plugin-equips-farm "D:\path\to\poi-plugin-equips-farm"

# 重启 POI 进行测试
```

### 许可证

MIT License

---

## English

### Features

- 📋 **Equipment Tracking**: Set target quantities for equipment you want to farm
- 🚢 **Ship Information**: View which ships provide target equipment and their remodel levels
- 📊 **Progress Display**: Real-time comparison of current inventory vs target quantity
- 🔔 **Drop Notifications**: Automatic alerts when you acquire useful ships
- 🔍 **Smart Filtering**: Filter by equipment type, name, or marked status
- 💾 **Auto-save**: Target settings are automatically saved and persist across restarts

### Installation

#### Method 1: Via POI Plugin Store (Recommended)
1. Open POI
2. Go to Settings → Plugins
3. Search for "Farming Assistant"
4. Click Install

#### Method 2: Manual Installation
1. Download the latest release
2. Extract to POI plugins directory:
   - Windows: `%APPDATA%\poi\plugins\node_modules\`
   - macOS/Linux: `~/.config/poi/plugins/node_modules/`
3. Restart POI

### Usage

1. **Set Target Equipment**
   - Find the equipment you need in the "Equipments" tab
   - Use `+` `-` buttons or type directly to set target quantity
   - Click on equipment to expand and view ships that provide it

2. **View Ships**
   - Switch to "Ships" tab
   - See what equipment each ship can provide
   - Sorted by remodel level

3. **Filtering**
   - Use search box to filter by name
   - Click equipment type icons to filter by type
   - Use All/Marked/Unmarked to toggle display status

### Data Source

This plugin uses the [WhoCallsTheFleet (WCTF)](https://github.com/TeamFleet/WhoCallsTheFleet) database for equipment acquisition information.

### Development

```bash
# Clone repository
git clone https://github.com/Lanyangzhi/poi-plugin-equips-farm.git

# Link to POI plugins directory
cd %APPDATA%\poi\plugins\node_modules
mklink /J poi-plugin-equips-farm "D:\path\to\poi-plugin-equips-farm"

# Restart POI for testing
```

### License

MIT License
