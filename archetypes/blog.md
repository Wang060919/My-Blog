---
title: {{ replace .Name "-" " " | title | jsonify }}
slug: {{ .Name | urlize | jsonify }}
description: ""
summary: ""
date: {{ .Date }}
lastmod: {{ .Date }}
draft: true
weight: 50
categories: []
tags: []
contributors: []
pinned: false
homepage: false
params:
  seo:
    title: "" # custom title (optional)
    description: "" # custom description (recommended)
    canonical: "" # custom canonical URL (optional)
    robots: "" # custom robot tags (optional)
---
