# 舰船养殖助手 (POI 插件)

帮助玩家从舰船中养殖特定装备。

## 安装与测试

### 1. 定位 POI 插件目录
在 Windows 上，默认插件目录通常位于：
`%APPDATA%\poi\plugins`
(例如：`C:\Users\YourUser\AppData\Roaming\poi\plugins`)

### 2. 安装/链接插件
您有两种选择：
- **复制**: 将整个 `poi-plugin-farming-assistant` 文件夹复制到 `plugins` 文件夹中。
- **符号链接 (开发推荐)**: 在 `plugins` 文件夹中打开终端并运行：
  ```powershell
  New-Item -ItemType Junction -Path "node_modules\poi-plugin-farming-assistant" -Target "D:\VibeCoding\poi-plugin"
  ```
  *注意：根据版本不同，POI 插件通常位于 `plugins` 文件夹内的 `node_modules` 中，或者直接位于 `plugins` 中。最稳妥的方法是放入 `%APPDATA%\poi\plugins\node_modules`（如果存在），或者直接放入 `%APPDATA%\poi\plugins`。*

### 3. 重启 POI
重新加载 POI（视图 -> 重载 或 重启应用）。插件应该出现在设置/插件列表中。

### 4. 调试
1. 打开 POI 开发者工具 (`Ctrl+Shift+I`)。
2. 切换到 **Console** (控制台) 标签页。
3. 粘贴以下代码片段以模拟舰船掉落（例如：五十铃）：

```javascript
// 模拟掉落 五十铃 (ID 110)
window.dispatchEvent(new CustomEvent('game.response', {
  detail: {
    path: '/kcsapi/api_req_sortie/battleresult',
    body: {
      api_get_ship: {
        api_ship_id: 110
      }
    }
  }
}));
```

如果您在 UI 中添加了“Type 21 Air Radar”（21号对空电探，来自五十铃）作为目标，您应该会看到一个 Toast 通知。
