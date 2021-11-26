# 推荐硬件架构



推荐架构：



![](./img/yingjianjiagou001.png)



如图，分配4台服务器搭建hadoop集群，2台服务器搭载应用。客户（医院）只访问应用服务器。

solr、hbase分布于存储节点服务器上
tomcat 分布于应用服务器
nginx 放置一台应用服务器上