# solr日期配置



经常有现场，solr中存储的时间跟统一视图展示的时间不一致，相差8小时，这是由于时间API采用不同的时区计时导致的。出现这种情况需手动补偿时差



| **配置项**           | **取值**             | **说明**       |
| -------------------- | -------------------- | -------------- |
| SOLR_DATE_OPER_VALUE | 例如：8H             | solr时差操作值 |
| SOLR_DATE_OPER       | sub表示减，add表示加 | 时差操作       |

