using haystack
using skyarc
using skyarcd


@ExtMeta
{
  name    = "dkAppExt"
  icon  = "dkLogo" //取自uiIcons.pod的svg
}

const class dkAppExt : Ext {
  //当前请求里的扩展实例
  static const Str metaName := (dkAppExt#.facet(ExtMeta#, true) as ExtMeta).name
  static dkAppExt cur() { Context.cur.proj.ext(metaName) }

  // 观察者列表
  const IObserver[] observers := [EquipObserver(this)]

  // pod启动时启动所有观察者
  override Void onStart() {
    observers.each { it.onStart }
  }
  // pod停止时停止所有观察者
  override Void onStop() {
    observers.each { it.onStop }
  }
}