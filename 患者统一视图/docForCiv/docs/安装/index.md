---
toc: menu
nav:
  title: 安装
  order: 2
---


# 安装



安装统一视图目标为：

1、hdr-civ包和restserver能正确启动

2、利用抽数包往solr定时存储全量数据

3、利用spark程序包，实时往solr的就诊列表collection（默认名称为`collectioncivlist`）存储数据。

4、利用Key-Value Store Indexer组件，实时同步solr的患者信息collection（默认名称为`collpatient`）与hbase的患者信息表。
