using haystack
using skyarc
using skyarcd

// 最小观察者：监听 equip 记录的新增/删除，只打日志
const class EquipObserver : IObserver {
  //Fantom 允许字段覆盖无参抽象方法，调用方写 className 或 className() 
  override const Str className := EquipObserver#.name
  override const Ext ext

  new make(Ext ext) { this.ext = ext }

  override Void onStart() {
    ext.log.info("$className started")
    observe(
      "obsCommits",// 事件源
      #onCommit,// 本类回调方法
      Etc.makeDict([// 配置参数 ，Etc.makeDict()， Fantom 的 Map 转成 haystack 的 Dict
        "obsFilter":  "equip",// haystack filter，只匹配带 equip 标签的记录
        "obsAdds":    Marker.val,// 只监听新增记录
        "obsRemoves": Marker.val,// 只监听删除记录
      ])
    )
  }

  override Void onStop() {
    ext.log.info("$className stopped")
  }

  Void onCommit(Dict msg) {// msg 是事件消息，本身是个 Dict
    subType := msg["subType"]
    id := msg["id"]
    ext.log.info("$className got commit: subType=$subType id=$id")
  }
}
