---
date: {{ .Date }}
draft: true
title: {{ replace .File.ContentBaseName "-" " " | title | jsonify }}
slug: {{ .File.ContentBaseName | urlize | jsonify }}
---
