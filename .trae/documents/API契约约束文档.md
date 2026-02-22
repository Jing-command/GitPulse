# GitPulse API 契约约束文档

## 一、API 设计原则

### 1.1 RESTful 设计规范

本 API 设计遵循腾讯 RESTful API 设计规范，使用「能愿动词」说明规范要求：

| 能愿动词 | 说明 |
|----------|------|
| **必须 (MUST)** | 绝对，严格遵循，请照做，无条件遵守 |
| **一定不可 (MUST NOT)** | 禁令，严令禁止 |
| **应该 (SHOULD)** | 强烈建议这样做，但是不强求 |
| **不该 (SHOULD NOT)** | 强烈不建议这样做，但是不强求 |
| **可以 (MAY)** | 选择性高一点 |

#### 1.1.1 协议规范

- 客户端在通过 API 与后端服务通信的过程中，**应该**使用 HTTPS 协议
- 所有 API **必须**保持向后兼容

#### 1.1.2 URL 设计规范

| 规范项 | 要求 |
|--------|------|
| URL 命名 | **必须**全部小写 |
| 资源命名 | **必须**是名词，并且**必须**是复数形式 |
| URL 可读性 | **必须**是易读的 |
| 架构暴露 | **一定不可**暴露服务器架构 |
| 连字符使用 | **必须**统一使用下划线（`_`）风格 |

#### 1.1.3 HTTP 动词规范

| HTTP 方法 | 用途 | SQL 对应 |
|-----------|------|----------|
| GET | 从服务器取出资源（一项或多项） | SELECT |
| POST | 在服务器新建一个资源 | CREATE |
| PUT | 在服务器更新资源（客户端提供改变后的完整资源） | UPDATE |
| PATCH | 在服务器更新资源（客户端提供改变的属性） | UPDATE |
| DELETE | 从服务器删除资源 | DELETE |

**规范要求**：
- 删除资源**必须**用 DELETE 方法
- 创建新的资源**必须**使用 POST 方法
- 更新资源**应该**使用 PUT 方法
- 获取资源信息**必须**使用 GET 方法

#### 1.1.4 过滤参数规范

- 所有 URL 参数**必须**是全小写
- **必须**使用下划线类型的参数形式
- 分页参数**必须**固定为 `page`、`per_page`

#### 1.1.5 HTTP 状态码规范

**必须**遵守 HTTP 设计规范，**一定不可**所有接口都返回状态码为 200 的 HTTP 响应。

| 状态码范围 | 说明 |
|------------|------|
| 1xx | 信息，服务器收到请求，需要请求者继续执行操作 |
| 2xx | 成功，操作被成功接收并处理 |
| 3xx | 重定向，需要进一步的操作以完成请求 |
| 4xx | 客户端错误，请求包含语法错误或无法完成请求 |
| 5xx | 服务器错误，服务器在处理请求的过程中发生了错误 |

**重要**：所有 API **一定不可**返回 1xx 类型的状态码。

---

### 1.2 版本控制

所有的 API **必须**保持向后兼容，**必须**在引入新版本 API 的同时确保旧版本 API 仍然可用。

版本号形式：在 URL 中嵌入版本编号

```
/api/v1/*
```

---

### 1.3 通用响应结构

#### 1.3.1 成功响应

**必须**使用正确的 HTTP 状态码（2xx），响应体结构如下：

```typescript
/**
 * 成功响应结构
 */
interface ApiResponse<T> {
  code: number;                    // 业务状态码，0 表示成功
  message: string;                 // 响应消息
  data: T;                         // 响应数据
  request_id: string;              // 请求唯一标识，用于问题定位
  timestamp: number;               // 时间戳（毫秒）
}
```

#### 1.3.2 分页响应

```typescript
/**
 * 分页响应结构
 */
interface PagedResponse<T> {
  code: number;
  message: string;
  data: {
    list: T[];                     // 数据列表
    pagination: {
      page: number;                // 当前页码
      per_page: number;            // 每页数量
      total: number;               // 总数量
      total_pages: number;         // 总页数
    };
  };
  request_id: string;
  timestamp: number;
}
```

#### 1.3.3 错误响应

当 API 发生错误时，**必须**返回出错时的详细信息：

```typescript
/**
 * 错误响应结构
 */
interface ErrorResponse {
  code: number;                    // 错误码
  message: string;                 // 错误消息（面向开发者）
  user_message?: string;           // 用户友好的错误提示（面向用户）
  errors?: FieldError[];           // 字段级错误
  request_id: string;              // 请求唯一标识
  timestamp: number;
}

/**
 * 字段错误
 */
interface FieldError {
  field: string;                   // 字段名（下划线格式）
  message: string;                 // 错误消息
}
```

---

### 1.4 错误码定义

错误码采用分段设计，便于快速定位问题类型：

| 错误码范围 | 说明 |
|------------|------|
| 0 | 成功 |
| 10000-19999 | 参数校验错误 |
| 20000-29999 | 认证授权错误 |
| 30000-39999 | 资源不存在错误 |
| 40000-49999 | 业务逻辑错误 |
| 50000-59999 | 服务器内部错误 |

#### 详细错误码表

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| 0 | 200 | 成功 |
| 10001 | 400 | 请求参数错误 |
| 10002 | 400 | 请求体格式错误 |
| 10003 | 400 | 请求参数验证失败 |
| 10004 | 400 | 必填参数缺失 |
| 20001 | 401 | 未登录 |
| 20002 | 401 | Token 已过期 |
| 20003 | 401 | Token 无效 |
| 20004 | 403 | 无权限访问 |
| 20005 | 403 | 资源禁止访问 |
| 30001 | 404 | 资源不存在 |
| 30002 | 404 | 项目不存在 |
| 30003 | 404 | 内容不存在 |
| 30004 | 404 | 用户不存在 |
| 40001 | 409 | 资源已存在 |
| 40002 | 409 | 邮箱已被注册 |
| 40003 | 409 | 项目名称已存在 |
| 50001 | 500 | 服务器内部错误 |
| 50002 | 500 | 数据库错误 |
| 50003 | 502 | AI 服务不可用 |
| 50004 | 503 | Git 操作失败 |

---

## 二、认证接口

### 2.1 用户注册

**请求**
```http
POST /api/v1/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "张三"
}
```

**成功响应** `HTTP/1.1 201 Created`
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": "clx123456",
    "email": "user@example.com",
    "name": "张三",
    "role": "viewer",
    "created_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

**错误响应** `HTTP/1.1 400 Bad Request`
```json
{
  "code": 10003,
  "message": "请求参数验证失败",
  "user_message": "请检查您填写的信息是否正确",
  "errors": [
    {
      "field": "password",
      "message": "密码长度必须大于8位"
    }
  ],
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 2.2 用户登录

**请求**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "clx123456",
      "email": "user@example.com",
      "name": "张三",
      "role": "viewer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

**错误响应** `HTTP/1.1 401 Unauthorized`
```json
{
  "code": 20001,
  "message": "邮箱或密码错误",
  "user_message": "您输入的邮箱或密码不正确，请重新输入",
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 2.3 OAuth 登录

**请求**
```http
POST /api/v1/auth/oauth
Content-Type: application/json

{
  "provider": "github",
  "code": "oauth_authorization_code"
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "OAuth 登录成功",
  "data": {
    "user": {
      "id": "clx123456",
      "email": "user@example.com",
      "name": "张三",
      "role": "viewer",
      "oauth_provider": "github"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 2.4 刷新 Token

**请求**
```http
POST /api/v1/auth/refresh
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "Token 刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 2.5 获取当前用户

**请求**
```http
GET /api/v1/users/me
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "clx123456",
    "email": "user@example.com",
    "name": "张三",
    "role": "admin",
    "created_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

---

## 三、项目接口

### 3.1 获取项目列表

**请求**
```http
GET /api/v1/projects?page=1&per_page=10&keyword=git
Authorization: Bearer {token}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| per_page | number | 否 | 每页数量，默认 10，最大 100 |
| keyword | string | 否 | 搜索关键词 |

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "clx123456",
        "name": "GitPulse",
        "description": "技术内容全自动流水线",
        "repo_url": "https://github.com/user/gitpulse",
        "member_count": 5,
        "commit_count": 128,
        "content_count": 45,
        "last_sync_at": 1700000000000,
        "created_at": 1700000000000
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total": 1,
      "total_pages": 1
    }
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 3.2 创建项目

**请求**
```http
POST /api/v1/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "GitPulse",
  "description": "技术内容全自动流水线",
  "repo_url": "https://github.com/user/gitpulse",
  "config": {
    "ai": {
      "provider": "openai",
      "model": "gpt-4"
    },
    "content": {
      "languages": ["zh", "en"],
      "formats": ["markdown", "json"]
    },
    "docs": {
      "framework": "vitepress",
      "output": "./docs"
    }
  }
}
```

**成功响应** `HTTP/1.1 201 Created`
```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": "clx123456",
    "name": "GitPulse",
    "description": "技术内容全自动流水线",
    "repo_url": "https://github.com/user/gitpulse",
    "config": {
      "ai": {
        "provider": "openai",
        "model": "gpt-4"
      },
      "content": {
        "languages": ["zh", "en"],
        "formats": ["markdown", "json"]
      },
      "docs": {
        "framework": "vitepress",
        "output": "./docs"
      }
    },
    "created_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 3.3 获取项目详情

**请求**
```http
GET /api/v1/projects/{project_id}
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "clx123456",
    "name": "GitPulse",
    "description": "技术内容全自动流水线",
    "repo_url": "https://github.com/user/gitpulse",
    "config": {
      "ai": {
        "provider": "openai",
        "model": "gpt-4"
      },
      "content": {
        "languages": ["zh", "en"],
        "formats": ["markdown", "json"]
      },
      "docs": {
        "framework": "vitepress",
        "output": "./docs"
      }
    },
    "statistics": {
      "member_count": 5,
      "commit_count": 128,
      "content_count": 45,
      "changelog_count": 20,
      "blog_count": 15,
      "seo_count": 10
    },
    "last_sync_at": 1700000000000,
    "created_at": 1700000000000,
    "updated_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

**错误响应** `HTTP/1.1 404 Not Found`
```json
{
  "code": 30002,
  "message": "项目不存在",
  "user_message": "您访问的项目不存在或已被删除",
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 3.4 更新项目

**请求**
```http
PUT /api/v1/projects/{project_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "GitPulse Pro",
  "description": "升级版技术内容流水线",
  "config": {
    "ai": {
      "provider": "anthropic",
      "model": "claude-3-opus"
    }
  }
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": "clx123456",
    "name": "GitPulse Pro",
    "description": "升级版技术内容流水线",
    "updated_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 3.5 删除项目

**请求**
```http
DELETE /api/v1/projects/{project_id}
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 204 No Content`

无响应体

---

## 四、Commit 分析接口

### 4.1 获取 Commit 列表

**请求**
```http
GET /api/v1/projects/{project_id}/commits?page=1&per_page=20&type=feature
Authorization: Bearer {token}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| per_page | number | 否 | 每页数量 |
| type | string | 否 | 变更类型：feature/fix/refactor/docs/test/chore |
| from | string | 否 | 起始时间（ISO 8601） |
| to | string | 否 | 结束时间（ISO 8601） |

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "clx123456",
        "hash": "a1b2c3d4e5f6",
        "message": "feat: 添加 AI 文案生成功能",
        "author": "张三",
        "timestamp": 1700000000000,
        "impact_level": "minor",
        "summary": {
          "type": "feature",
          "scope": ["content-engine"],
          "keywords": ["AI", "文案生成", "GPT"],
          "breaking": false
        },
        "has_content": true
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 128,
      "total_pages": 7
    }
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 4.2 获取 Commit 详情

**请求**
```http
GET /api/v1/projects/{project_id}/commits/{commit_id}
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "clx123456",
    "hash": "a1b2c3d4e5f6",
    "message": "feat: 添加 AI 文案生成功能",
    "author": "张三",
    "author_email": "zhangsan@example.com",
    "timestamp": 1700000000000,
    "impact_level": "minor",
    "summary": {
      "type": "feature",
      "scope": ["content-engine"],
      "keywords": ["AI", "文案生成", "GPT"],
      "breaking": false
    },
    "changes": [
      {
        "path": "packages/core/src/content-engine/generators/ai-generator.ts",
        "type": "add",
        "language": "typescript",
        "functions": [
          {
            "name": "generateContent",
            "type": "add",
            "signature": "generateContent(prompt: string, context: ProjectContext): Promise<string>",
            "description": "使用 AI 生成内容"
          }
        ]
      }
    ],
    "contents": [
      {
        "id": "clx789012",
        "type": "changelog",
        "title": "新增 AI 文案生成功能",
        "status": "published"
      }
    ]
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 4.3 触发 Commit 分析

**请求**
```http
POST /api/v1/projects/{project_id}/commits/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "from": "HEAD~10",
  "to": "HEAD",
  "incremental": true
}
```

**成功响应** `HTTP/1.1 202 Accepted`
```json
{
  "code": 0,
  "message": "分析任务已创建",
  "data": {
    "task_id": "task_123456",
    "status": "pending",
    "estimated_time": 30
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

---

## 五、内容接口

### 5.1 获取内容列表

**请求**
```http
GET /api/v1/projects/{project_id}/contents?page=1&per_page=10&type=changelog&status=published
Authorization: Bearer {token}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| per_page | number | 否 | 每页数量 |
| type | string | 否 | 内容类型：changelog/technical/seo |
| status | string | 否 | 状态：draft/pending_review/approved/published/archived |
| language | string | 否 | 语言 |

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "clx123456",
        "type": "changelog",
        "title": "v1.2.0 版本更新日志",
        "language": "zh",
        "status": "published",
        "commit_hash": "a1b2c3d4",
        "metadata": {
          "keywords": ["新功能", "优化"],
          "tags": ["v1.2.0", "feature"],
          "reading_time": 3,
          "seo_score": 85
        },
        "created_at": 1700000000000,
        "published_at": 1700001000000
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total": 45,
      "total_pages": 5
    }
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 5.2 获取内容详情

**请求**
```http
GET /api/v1/projects/{project_id}/contents/{content_id}
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "clx123456",
    "type": "changelog",
    "title": "v1.2.0 版本更新日志",
    "content": "# v1.2.0 更新日志\n\n## 新功能\n...",
    "formats": {
      "markdown": "# v1.2.0 更新日志\n...",
      "json": "{\"title\": \"v1.2.0 更新日志\", ...}",
      "html": "<h1>v1.2.0 更新日志</h1>..."
    },
    "language": "zh",
    "status": "published",
    "commit_hash": "a1b2c3d4",
    "commit": {
      "hash": "a1b2c3d4",
      "message": "feat: 添加新功能",
      "author": "张三"
    },
    "metadata": {
      "keywords": ["新功能", "优化"],
      "summary": "本次更新带来了多项新功能和性能优化...",
      "tags": ["v1.2.0", "feature"],
      "reading_time": 3,
      "seo_score": 85
    },
    "author": {
      "id": "user_123",
      "name": "张三"
    },
    "versions": [
      {
        "version": 2,
        "created_at": 1700001000000,
        "author": {
          "id": "user_123",
          "name": "张三"
        },
        "change_log": "修复错别字"
      }
    ],
    "created_at": 1700000000000,
    "updated_at": 1700001000000,
    "published_at": 1700001000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 5.3 创建内容

**请求**
```http
POST /api/v1/projects/{project_id}/contents
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "changelog",
  "title": "v1.3.0 版本更新日志",
  "content": "# v1.3.0 更新日志\n\n## 新功能\n...",
  "language": "zh",
  "commit_hash": "b2c3d4e5",
  "metadata": {
    "keywords": ["新功能"],
    "tags": ["v1.3.0"]
  }
}
```

**成功响应** `HTTP/1.1 201 Created`
```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": "clx123456",
    "type": "changelog",
    "title": "v1.3.0 版本更新日志",
    "status": "draft",
    "created_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 5.4 更新内容

**请求**
```http
PUT /api/v1/projects/{project_id}/contents/{content_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "v1.3.0 版本更新日志（修订版）",
  "content": "# v1.3.0 更新日志\n\n## 新功能\n...",
  "change_log": "更新标题和内容"
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": "clx123456",
    "version": 2,
    "updated_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 5.5 删除内容

**请求**
```http
DELETE /api/v1/projects/{project_id}/contents/{content_id}
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 204 No Content`

无响应体

### 5.6 提交审核

**请求**
```http
POST /api/v1/projects/{project_id}/contents/{content_id}/submit
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "已提交审核",
  "data": {
    "id": "clx123456",
    "status": "pending_review"
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 5.7 审核内容

**请求**
```http
POST /api/v1/projects/{project_id}/contents/{content_id}/review
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved",
  "comment": "内容质量很好，可以发布"
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "审核完成",
  "data": {
    "id": "clx123456",
    "status": "approved",
    "approval": {
      "reviewer": {
        "id": "user_456",
        "name": "李四"
      },
      "comment": "内容质量很好，可以发布",
      "created_at": 1700000000000
    }
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 5.8 发布内容

**请求**
```http
POST /api/v1/projects/{project_id}/contents/{content_id}/publish
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "发布成功",
  "data": {
    "id": "clx123456",
    "status": "published",
    "published_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 5.9 生成内容

**请求**
```http
POST /api/v1/projects/{project_id}/contents/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "commit_hash": "a1b2c3d4",
  "types": ["changelog", "technical", "seo"],
  "languages": ["zh", "en"]
}
```

**成功响应** `HTTP/1.1 202 Accepted`
```json
{
  "code": 0,
  "message": "内容生成任务已创建",
  "data": {
    "task_id": "task_123456",
    "status": "pending",
    "estimated_time": 60
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 5.10 版本回滚

**请求**
```http
POST /api/v1/projects/{project_id}/contents/{content_id}/rollback
Authorization: Bearer {token}
Content-Type: application/json

{
  "version": 1
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "回滚成功",
  "data": {
    "id": "clx123456",
    "version": 3,
    "rolled_back_from": 2,
    "rolled_back_to": 1
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

---

## 六、团队接口

### 6.1 获取项目成员

**请求**
```http
GET /api/v1/projects/{project_id}/members
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "user_id": "user_123",
        "name": "张三",
        "email": "zhangsan@example.com",
        "role": "admin",
        "joined_at": 1700000000000
      },
      {
        "user_id": "user_456",
        "name": "李四",
        "email": "lisi@example.com",
        "role": "editor",
        "joined_at": 1700001000000
      }
    ]
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 6.2 添加成员

**请求**
```http
POST /api/v1/projects/{project_id}/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "wangwu@example.com",
  "role": "editor"
}
```

**成功响应** `HTTP/1.1 201 Created`
```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "user_id": "user_789",
    "name": "王五",
    "email": "wangwu@example.com",
    "role": "editor",
    "joined_at": 1700000000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 6.3 更新成员角色

**请求**
```http
PUT /api/v1/projects/{project_id}/members/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "admin"
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "user_id": "user_789",
    "role": "admin"
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 6.4 移除成员

**请求**
```http
DELETE /api/v1/projects/{project_id}/members/{user_id}
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 204 No Content`

无响应体

---

## 七、任务接口

### 7.1 获取任务状态

**请求**
```http
GET /api/v1/tasks/{task_id}
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "task_123456",
    "type": "content_generation",
    "status": "completed",
    "progress": 100,
    "result": {
      "contents": [
        {
          "id": "clx123456",
          "type": "changelog",
          "title": "v1.2.0 更新日志"
        }
      ]
    },
    "created_at": 1700000000000,
    "completed_at": 1700001000000
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

---

## 八、SEO 接口

### 8.1 分析内容 SEO

**请求**
```http
POST /api/v1/seo/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "GitPulse v1.2.0 发布 - AI 驱动的文档生成工具",
  "content": "# GitPulse v1.2.0 发布\n\n## 新功能\n...",
  "keywords": ["GitPulse", "文档生成", "AI"]
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "分析完成",
  "data": {
    "score": {
      "total": 85,
      "title": 90,
      "content": 82,
      "keywords": 88,
      "readability": 80
    },
    "keywords": [
      {
        "keyword": "GitPulse",
        "frequency": 5,
        "density": 2.5,
        "positions": ["title", "h1", "content"]
      }
    ],
    "suggestions": [
      "建议在第一段中包含主要关键词",
      "标题长度适中，建议保持在 50-60 字符"
    ]
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 8.2 提取关键词

**请求**
```http
POST /api/v1/seo/keywords
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "# GitPulse v1.2.0 发布\n\n## 新功能\n...",
  "count": 10
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "提取成功",
  "data": {
    "keywords": [
      {"keyword": "GitPulse", "score": 0.95},
      {"keyword": "文档生成", "score": 0.88},
      {"keyword": "AI", "score": 0.85},
      {"keyword": "自动化", "score": 0.80}
    ]
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

---

## 九、配置接口

### 9.1 获取全局配置

**请求**
```http
GET /api/v1/settings
Authorization: Bearer {token}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "ai": {
      "provider": "openai",
      "model": "gpt-4",
      "fallback_provider": "anthropic",
      "fallback_model": "claude-3-opus"
    },
    "content": {
      "default_languages": ["zh", "en"],
      "default_formats": ["markdown", "json"]
    },
    "review": {
      "enabled": true,
      "auto_publish": false
    },
    "preview": {
      "enabled": true,
      "port": 3000
    }
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

### 9.2 更新全局配置

**请求**
```http
PUT /api/v1/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "ai": {
    "provider": "anthropic",
    "model": "claude-3-opus"
  }
}
```

**成功响应** `HTTP/1.1 200 OK`
```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "ai": {
      "provider": "anthropic",
      "model": "claude-3-opus"
    }
  },
  "request_id": "req_abc123",
  "timestamp": 1700000000000
}
```

---

## 十、Webhook 接口

### 10.1 Webhook 事件类型

| 事件 | 说明 |
|------|------|
| `content.created` | 内容创建 |
| `content.updated` | 内容更新 |
| `content.published` | 内容发布 |
| `content.deleted` | 内容删除 |
| `commit.analyzed` | Commit 分析完成 |
| `task.completed` | 任务完成 |

### 10.2 Webhook 载荷格式

```json
{
  "event": "content.published",
  "timestamp": 1700000000000,
  "data": {
    "project_id": "clx123456",
    "content": {
      "id": "clx789012",
      "type": "changelog",
      "title": "v1.2.0 更新日志"
    }
  },
  "signature": "sha256=..."
}
```

---

## 十一、请求限制

### 11.1 速率限制

| 接口类型 | 限制 | 窗口 |
|----------|------|------|
| 普通接口 | 100 次 | 1 分钟 |
| 内容生成 | 10 次 | 1 分钟 |
| Commit 分析 | 5 次 | 1 分钟 |

### 11.2 响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000060
X-Request-Id: req_abc123
```

---

## 十二、安全要求

### 12.1 认证方式

- 使用 JWT Bearer Token 认证
- Token 有效期：2 小时
- 刷新 Token 有效期：7 天

### 12.2 权限控制

| 角色 | 权限 |
|------|------|
| admin | 所有操作 |
| editor | 创建、编辑、提交审核 |
| viewer | 仅查看 |

### 12.3 数据验证

- 所有输入参数**必须**进行类型验证
- 字符串长度限制
- 枚举值校验
- SQL 注入防护
- XSS 防护

---

## 十三、规范遵循声明

本 API 设计严格遵循腾讯 RESTful API 设计规范：

| 规范项 | 遵循状态 | 说明 |
|--------|----------|------|
| HTTPS 协议 | ✅ | 生产环境必须使用 HTTPS |
| URL 小写 | ✅ | 所有 URL 路径和参数均为小写 |
| 资源名词复数 | ✅ | 如 `/projects`、`/contents`、`/users` |
| 下划线参数命名 | ✅ | 如 `per_page`、`project_id`、`commit_hash` |
| 固定分页参数 | ✅ | 使用 `page`、`per_page` |
| 正确 HTTP 状态码 | ✅ | 200/201/204/400/401/403/404/409/500/502/503 |
| HTTP 动词规范 | ✅ | GET/POST/PUT/PATCH/DELETE 正确使用 |
| 错误详情返回 | ✅ | 包含 code、message、user_message、request_id |
| 版本控制 | ✅ | URL 路径版本控制 `/api/v1/` |

---

**文档版本：v1.1**
**最后更新：2024-01-01**
**规范遵循：腾讯 RESTful API 设计规范**
