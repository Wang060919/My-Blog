---
title: "Mermaid测试页"
date: 2025-01-20T10:00:00+08:00
draft: true
---

# Mermaid图表测试

## 测试流程图

{{< mermaid >}}
graph TD
    A[开始] --> B[步骤1]
    B --> C[步骤2]
    C --> D[结束]
    
    style A fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    style B fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style C fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style D fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
{{< /mermaid >}}

## 测试循环流程

{{< mermaid >}}
graph LR
    A[步骤1] --> B[步骤2]
    B --> C[步骤3]
    C --> A
    
    style A fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style B fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    style C fill:#fff8e1,stroke:#f57f17,stroke-width:2px
{{< /mermaid >}}

如果你能看到上面两个彩色的流程图，说明Mermaid配置成功了！
