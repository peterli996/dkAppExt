using axon
using folio
using haystack
using jobExt
using skyarcd

**
** Axon functions
**
const class dkAppLib
{

  @Axon
  static Void exampleFunc( )
  {
    echo("This is a fantom func example!")
  }

  ** 临时测试：后端 Fantom 读取 locale/*.props
  @Axon
  static Dict localeTest()
  {
    pod := dkAppLib#.pod
    zh := ""
    en := ""
    itDis := ""
    // Locale.use 返回的是 Locale 本身，不是闭包结果，所以结果写到外面的局部变量
    Locale("zh").use { zh = pod.locale("dkAppExt.testKey") }
    Locale("en").use { en = pod.locale("dkAppExt.testKey") }
    Locale("it").use { itDis = pod.locale("dkAppExt.ext.dis") }

    return Etc.makeDict([
      "curLocale":   Locale.cur.toStr,
      "curByPod":    pod.locale("dkAppExt.testKey"),
      "curByInterp": "$<dkAppExt.testKey>",
      "zh":          zh,
      "en":          en,
      "itFallback":  itDis,
      "missing":     pod.locale("dkAppExt.noSuchKey"),
    ])
  }

  ** 列出告警程序模板（name / description / args）
  @Axon
  static Dict[] dkAlarmTemplates()
  {
    return AlarmTemplateHandler.list
  }

  ** 按模板创建告警程序：dkAlarmCreate("dkHighAlarm", {name:"...", programOn:"id == @xxx", threshold:50})
  @Axon { admin = true }
  static Dict dkAlarmCreate(Str templateName, Dict args)
  {
    try { return AlarmTemplateHandler.create(Context.cur, templateName, args) }
    catch (Err e) { dkAppExt.cur.log.err("dkAlarmCreate failed", e); throw e }
  }

  ** 告警路由回调：callFunc 路由在告警产生/恢复时调用，参数是告警记录和来源点位
  ** 路由在 alarmExt 自己的 actor 里执行，没有 Context，所以这里用 Log.get 而不是 dkAppExt.cur
  @Axon
  static Void dkOnAlarm(Dict alarm, Dict? source)
  {
    state  := alarm["state"]
    msg    := alarm["message"]
    active := alarm.has("active")
    src    := source?.get("dis")
    Log.get("dkAppExt").info("dkOnAlarm: state=$state active=$active source=$src message=$msg")
  }

  ** 最小 Job 示例：真正干活的函数，供 jobRun 调用（不要直接调用它测试进度，要走下面两种 job 方式）
  @Axon
  static Void dkTestJob(Str param := "dk")
  {
    JobExample.doTestJob(param)
  }

  // 坑2：@Axon 静态函数体里没有隐式的 cx 变量（跟 03-job-development.md 的示例代码不一样，那是简化伪代码）。
  // 查过 alarmExt 自带源码（AlarmFuncs.fan）确认：官方内部实现都是显式 Context.cur / HxContext.curHx，这里照做。

  ** 方式 A：ephemeral，不落库，立即返回 jobHandle
  @Axon
  static Str dkRunJobEphemeral(Str param := "dk")
  {
    JobExample.runEphemeral(param, Context.cur)
  }

  ** 方式 B：持久化 —— 先 commit 一条 jobDef 记录（src 是 Axon 源码），拿到它的 id 后调用这个
  @Axon
  static Str dkRunJobById(Ref jobId)
  {
    JobLib.jobRun(Context.cur.parse(jobId.toCode))
  }

  ** 同步等待 job 结束，返回最终状态 Grid（jobStatus / message 等字段）
  @Axon
  static Grid dkWaitForJob(Str handle)
  {
    JobExample.waitForJob(handle)
  }

}