using concurrent
using haystack
using skyarc
using skyarcd

// 观察者的通用抽象：子类只需实现 onStart / onStop 和自己的回调
mixin IObserver {
  abstract Str className()
  abstract Ext ext()

  abstract Void onStart()
  abstract Void onStop()

  // 订阅 observable，回调在扩展的 actor 池里执行
  internal Void observe(Str obs, Method handler, Dict config) {
    fn := #onEvent.func.bind([this, handler])
    ext.observe(obs, config, Actor(ext.proj.extActorPool, fn))
  }

  // 回调前临时注入 Context，回调后恢复，避免污染 actor 池
  private Void onEvent(Method handler, Dict msg) {
    old := Actor.locals[Etc.cxActorLocalsKey]
    Actor.locals[Etc.cxActorLocalsKey] = Context(ext.sys, User.conn, ext.proj)
    try handler.call(this, msg)
    catch (Err e) {
      ext.log.err("$className onEvent failed: $e.msg", e)
      throw e
    }
  // actor 池是共享的，同一个 Actor 之后可能被调度去执行别的消息，不恢复就会把这次的 Context 残留给下一次。
    finally Actor.locals[Etc.cxActorLocalsKey] = old
  }
}
