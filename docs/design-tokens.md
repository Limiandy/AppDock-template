# UI Token 提炼：管理系统设计语言

参考作品：Behance《Management system design 明源云采购开发商后台管理系统》(CRTG.，gallery
`124804343`)。本文只提炼设计语言（颜色、排版、尺寸、组件规则），不复制其品牌资产、Logo 或业务内容。

## 1. 提取方法与证据

1. 抓取 13 张设计板，其中第 5 板为设计系统板（功能布局 / 颜色 / 图标）。
2. 对色板与真实界面截图做像素取样（PIL）：统计大面积实色、逐行扫描组件边界。
3. 交叉验证：色板标注值与界面实测值一致才收为 token；不一致的以实测为准。

需要说明的两点：

- 设计稿第 5 板中蓝、青两个色块的文字标注都是 `#F85300`（复制粘贴笔误），实际色块取样为 `#546FFD`、`#55C5CD`。
- 该设计基本**没有使用绿色**语义色；正向/成功状态用青色（`#55C5CD`）表达，错误红在设计稿中未出现（下文给了协调色提案）。

## 2. 色板

### 2.1 品牌与功能色

| 语义               | 值        | 来源                                                      |
| ------------------ | --------- | --------------------------------------------------------- |
| 品牌色 Brand       | `#F85300` | 第 5 板「品牌色 #F85300」；界面取样 `#F95300` / `#FA5302` |
| 主交互色 Primary   | `#546FFD` | 第 5 板蓝块实测；界面主按钮大面积填充（单板 5 万+ 像素）  |
| 辅色 Secondary     | `#55C5CD` | 第 5 板青块实测；图表、状态点缀                           |
| 信息 Info          | `#546FFD` | 复用主交互色（链接、选中、提示）                          |
| 成功 Success       | `#55C5CD` | 复用辅色；设计稿无独立绿色                                |
| 警告 Warning       | `#FCAF07` | board06/10 图表黄（hue 41°）                              |
| 错误 Error（提案） | `#E5484D` | 设计稿未覆盖，按品牌色相协调补全                          |

### 2.2 主色派生

| 名称             | 值        | 用途                                           |
| ---------------- | --------- | ---------------------------------------------- |
| primary          | `#546FFD` | 主按钮、选中态、链接、激活图标                 |
| primary-hover    | `#6E84FE` | 实测 hover 蓝 `#778CFD`~`#8093FE`，取中值      |
| primary-active   | `#4761E0` | 按下态（按 H/S 推得）                          |
| primary-bg       | `#EEF1FF` | 侧栏选中底、标签底（实测 `#ECECF4`~`#EEF1FF`） |
| primary-bg-hover | `#E4E9FF` | 浅蓝底 hover                                   |
| primary-border   | `#D6DDFF` | 输入/分段控件描边（实测 `#D0D7FF`~`#D6DDFF`）  |

### 2.3 中性色（第 5 板标注 + 界面实测一致）

| 语义             | 值        | 用途                     |
| ---------------- | --------- | ------------------------ |
| 标题 Title       | `#18191E` | 页面标题、卡片主标题     |
| 深色/导航 Dark   | `#20294A` | 侧栏文字、次级标题、图标 |
| 正文 Body        | `#596078` | 表格内容、描述文字       |
| 辅助文字 Muted   | `#A6ADC4` | 占位符、说明、次级信息   |
| 更浅文字         | `#C3C8D9` | 禁用态文字（提案）       |
| 分割线 Divider   | `#E2E6F5` | 边框、表格分割、卡片描边 |
| 页面背景 Canvas  | `#F2F5FF` | 内容区背景               |
| 容器背景 Surface | `#FFFFFF` | 卡片、侧栏、顶栏         |
| 弱底 Fill        | `#F7F8FC` | 表头、hover 底           |
| 浅底 Fill-alt    | `#F5F7FF` | 行 hover、菜单 hover     |

### 2.4 图表色（board06 / board13 取样）

```text
#546FFD  主蓝（默认系列）
#55C5CD  青
#6C5EE7  紫
#33A6FF  天蓝
#FCAF07  黄
#F85300  橙（品牌强调）
```

深色侧栏/大面积色块的导航字色介于 `#20294A`~`#2D3654`，属于同一深蓝灰的明暗层次，token 统一取 `#20294A`。

## 2.5 深色扩展（提案）

参考作品只做浅色，暗色中性阶按同色相蓝灰推导，保留品牌蓝与青色，供仓库的暗色模式使用：

| 语义       | 值                              |
| ---------- | ------------------------------- |
| 页面背景   | `#0E1322`                       |
| 容器/卡片  | `#151A2E`                       |
| 浮层       | `#1A2140`                       |
| 主文字     | `#E9ECF8`                       |
| 次级文字   | `#A6ADC4`                       |
| 辅助文字   | `#7B84A3`                       |
| 描边/分割  | `#2C3556` / `#232C4A`           |
| 选中底     | `#25305C`                       |
| 主色文字态 | `#8FA2FF`（主色仍为 `#546FFD`） |

## 3. 排版

| 用途           | 字号 | 字重                 | 行高 |
| -------------- | ---- | -------------------- | ---- |
| 页面标题       | 24   | 600                  | 1.3  |
| 区块/卡片标题  | 20   | 600                  | 1.35 |
| 强调/名称      | 16   | 600                  | 1.4  |
| 正文/导航/表格 | 14   | 400（导航/按钮 500） | 1.57 |
| 辅助/标签      | 12   | 400                  | 1.5  |

字体栈（设计稿为中文系统字体渲染，无自定义字体）：

```css
"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif
```

实测参考：侧栏导航中文行高约 15px、页面标题约 24px、卡片内公司名约 14px、顶栏标题约 12~13px，与上表一致。

## 4. 尺寸、圆角、阴影

| 项目       | 值                                   | 依据                                                 |
| ---------- | ------------------------------------ | ---------------------------------------------------- |
| 基础间距   | 4 的倍数：8 / 12 / 16 / 20 / 24 / 32 | 界面量测                                             |
| 内容区留白 | 24~32                                | 卡片与页面边距                                       |
| 卡片内边距 | 20~24                                | 界面量测                                             |
| 侧栏宽度   | 152 / 折叠 64                        | 设计稿完整窗口反推（1440 栅格，实测展开 150~158）    |
| 顶栏高度   | 36                                   | 仓库布局取值，不随 Antd `controlHeight * 2` 推导     |
| 圆角-小    | 4 / 6                                | 标签、分段控件                                       |
| 圆角-默认  | 8                                    | 菜单项、输入框                                       |
| 圆角-大    | 12                                   | 主按钮（实测圆角约 12~13px）、卡片                   |
| 胶囊       | 999                                  | 筛选 chip                                            |
| 描边       | 1px `#E2E6F5`；输入/选中 `#D6DDFF`   | 界面实测                                             |
| 卡片阴影   | `0 4px 16px rgba(32, 41, 74, 0.06)`  | 极轻，仅用于悬浮层次                                 |
| 浮层阴影   | `0 8px 24px rgba(32, 41, 74, 0.12)`  | 弹窗/下拉                                            |
| 控件高度   | 常规 40 / 大 48 / 小 32              | 主按钮实测 51px（设计稿展示比例偏大，取 40/48 规格） |

## 5. 组件级规则

| 组件          | 规则                                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 顶栏          | 白底 + 1px 分割线；左侧折叠按钮 + 页面标题（14，500）；右侧用户区                                                                   |
| 侧栏          | 白底；菜单项 8 圆角、`#20294A` 文字与线性图标；选中项 `#EEF1FF` 底 + 左侧 3px `#546FFD` 激活条 + `#546FFD` 文字；分组标题 `#A6ADC4` |
| 主按钮        | `#546FFD` 底 + 白字 + 图标；12 圆角；无重阴影                                                                                       |
| 次按钮        | 白底 + `#D6DDFF` 描边 + `#20294A` 文字                                                                                              |
| 文字按钮/链接 | `#546FFD`，hover `#6E84FE`                                                                                                          |
| Tabs          | 选中 `#546FFD` + 2px 下划线；未选 `#596078`；间距 32                                                                                |
| Segmented     | 选中块白底 + `#D6DDFF` 描边 + `#546FFD` 文字；轨道 `#F2F5FF`                                                                        |
| 表格          | 表头 `#F7F8FC` 底 + `#596078` 文字（14）；行 hover `#F5F7FF`；分割线 `#E2E6F5`；选中行 `#EEF1FF`；操作按钮为文字按钮 + 图标         |
| 卡片          | 白底、12 圆角、`#E2E6F5` 描边、轻阴影；部分卡片带 `#546FFD → #7A8FFF` 渐变左竖条作为状态标识                                        |
| 标签/状态     | 浅底深字：蓝 `#EEF1FF`/`#546FFD`、青 `#EFF9FA`/`#2FA8B2`、橙 `#FFF1E8`/`#F85300`、灰 `#F2F3F8`/`#596078`                            |
| 图标          | 1.5px 线性风格、24px 网格；深色 `#20294A` 为主，激活/强调用 `#F85300` 或 `#546FFD`                                                  |

## 6. 映射到 Ant Design Vue Token

本仓库使用 Ant Design Vue 4.2（对应 antd v5 token 体系）。以下为可直接写入 `theme.token` / `theme.components` 的键。

### 6.1 全局 token

| Antd token                                                                       | 值                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `colorPrimary` / `colorInfo` / `colorLink`                                       | `#546FFD`                                                                 |
| `colorSuccess`                                                                   | `#55C5CD`                                                                 |
| `colorWarning`                                                                   | `#FCAF07`                                                                 |
| `colorError`                                                                     | `#E5484D`                                                                 |
| `colorPrimaryHover` / `colorLinkHover`                                           | `#6E84FE`                                                                 |
| `colorPrimaryActive` / `colorLinkActive`                                         | `#4761E0`                                                                 |
| `colorPrimaryBg`                                                                 | `#EEF1FF`                                                                 |
| `colorPrimaryBgHover`                                                            | `#E4E9FF`                                                                 |
| `colorPrimaryBorder`                                                             | `#D6DDFF`                                                                 |
| `colorTextBase`                                                                  | `#20294A`                                                                 |
| `colorText` / `colorTextSecondary` / `colorTextTertiary` / `colorTextQuaternary` | `#18191E` / `#596078` / `#A6ADC4` / `#C3C8D9`                             |
| `colorBgLayout` / `colorBgContainer` / `colorBgElevated`                         | `#F2F5FF` / `#FFFFFF` / `#FFFFFF`                                         |
| `colorBorder` / `colorBorderSecondary` / `colorSplit`                            | `#D6DDFF` / `#E2E6F5` / `#E2E6F5`                                         |
| `colorFillAlter` / `colorFillTertiary`                                           | `#F7F8FC` / `#F5F7FF`                                                     |
| `controlItemBgHover` / `controlItemBgActive`                                     | `#F5F7FF` / `#EEF1FF`                                                     |
| `fontFamily`                                                                     | `'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif`   |
| `fontSize` / `fontSizeSM` / `fontSizeLG`                                         | `14` / `12` / `16`                                                        |
| `borderRadius` / `borderRadiusSM` / `borderRadiusLG` / `borderRadiusXS`          | `8` / `6` / `12` / `4`                                                    |
| `controlHeight` / `controlHeightLG` / `controlHeightSM`                          | `40` / `48` / `32`                                                        |
| `boxShadow` / `boxShadowSecondary`                                               | `0 4px 16px rgba(32, 41, 74, 0.06)` / `0 8px 24px rgba(32, 41, 74, 0.12)` |
| `wireframe`                                                                      | `false`                                                                   |

### 6.2 组件 token

Ant Design Vue 4.2 中 `Layout`、`Menu` 可配置组件 token（`Table`、`Card`、`Tabs`、`Segmented`、`Tag`
在该版本没有组件 token，靠上面的全局 token 派生）：

| 组件   | token                                                                       | 值                                    |
| ------ | --------------------------------------------------------------------------- | ------------------------------------- |
| Layout | `colorBgHeader` / `colorBgBody` / `colorBgTrigger`                          | `#FFFFFF` / `#F2F5FF` / `#F2F5FF`     |
| Menu   | `radiusItem` / `radiusSubMenuItem`                                          | `8` / `8`                             |
| Menu   | `colorItemText` / `colorItemTextHover` / `colorItemTextSelected`            | `#20294A` / `#546FFD` / `#546FFD`     |
| Menu   | `colorItemBg` / `colorItemBgHover` / `colorItemBgSelected`                  | `transparent` / `#F5F7FF` / `#EEF1FF` |
| Menu   | `colorGroupTitle` / `colorSubItemBg`                                        | `#A6ADC4` / `transparent`             |
| Menu   | `colorActiveBarWidth` / `colorActiveBarHeight` / `colorActiveBarBorderSize` | `3` / `16` / `0`                      |

## 7. 落地（已全局接入）

实现见 `main-app/src/hooks/theme/presets/managementSystem.ts`，并已作为 `themeCore` 的默认主题：

- `globalThemeConfig` 初始化即合并 seed + light 中性层，布局、SuperTable、表单、表格等全局生效；
- 明暗切换调用 `applyThemeMode(mode)`：整层替换 light / dark 中性 token，品牌种子与主题编辑器自定义保持不变；
- 需要单独复用（例如给独立页面做主题预览）时：

```ts
import { getManagementSystemTheme } from '@/hooks/theme/presets/managementSystem'

const themeConfig = getManagementSystemTheme({ dark: false })
```

## 8. 覆盖缺口与后续

| 项              | 状态                                                                |
| --------------- | ------------------------------------------------------------------- |
| 暗色模式        | 参考作品未覆盖，已按 §2.5 蓝灰阶扩展到 `managementSystemDarkTokens` |
| 错误/危险语义色 | 设计稿未出现，`#E5484D` 为协调提案                                  |
| 成功绿          | 设计语言刻意不用绿色，统一用青色表达正向状态                        |
| 图表与状态色    | 已取主系列，缺完整 8~10 色扩展色阶                                  |
| 字重与字距      | 仅按界面比例推断，缺设计稿标注                                      |
| 动效            | 参考作品为静态稿，未提取；沿用 Antd 默认动效时长                    |
