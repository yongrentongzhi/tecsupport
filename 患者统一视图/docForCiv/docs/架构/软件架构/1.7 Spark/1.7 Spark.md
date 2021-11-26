# Spark



Hadoop 已经成为了典型的大数据批量处理架构，它实现了两个强有力的开源产品:HDFS 和 MapReduce。由 HDFS 负责静态数据的存储,并通过 MapReduce 将计算逻辑分配到各数据节点进行数据计算。之后以 HDFS 和 MapReduce 为基础建立了很多项目,形成了 Hadoop 生态圈.

Spark 则是类似Hadoop MapReduce的通用并行框架, 专门用于大数据量下的迭代式计算.是为了跟 Hadoop 配合而开发出来的,不是为了取代 Hadoop, Spark 运算比 Hadoop 的 MapReduce 框架快，原因是因为 Hadoop 在一次 MapReduce 运算之后,会将数据的运算结果从内存写入到磁盘中,第二次 Mapredue 运算时在从磁盘中读取数据,所以其瓶颈在2次运算间的多余 IO 消耗. Spark 则是将数据一直缓存在内存中,直到计算得到最后的结果,再将结果写入到磁盘,所以多次运算的情况下, Spark 是比较快的. 其优化了迭代式工作负载。