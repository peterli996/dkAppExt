using concurrent
using haystack  
using jobExt
using skyarcd

**
** 最小 Job 示例：循环 5 步，每步上报进度，可在 FIN 的 Job 管理页看到。
**
** === 测试用法（在 FIN 的 Shell 工具里跑，实测过）===
**
** 方式 A：ephemeral，不落库，直接拿 handle
**   h: dkRunJobEphemeral("test")
**
** 方式 B：持久化，先 commit 一条 job 记录，再按 id 跑
**   d: diff(null, {job, dis:"dk测试job", jobExpr:"dkTestJob(\"test\")"}, {add}).commit
**   h: dkRunJobById(d->id)
**   （标签必须是 job / jobExpr，不是 job/src 之类的名字；diff 的 orig 传 null 时必须带 {add} flag，
**    否则报 DiffErr: Must pass 'add' flag if oldRec is null）
**
** 手动查状态、观察变化：
**   jobStatus(h)     一次只返回当前这一瞬间的快照，不是订阅/推送，得自己反复敲才能看到过程
**   jobStatusAll()    不依赖 h 变量，查所有已知 job，行更稳（Shell 里重复执行也不会新建 job，是只读查询）
**   两者都别用 ↑ 翻历史把整段（含 dkRunJobXxx 那行）一起重新提交，不然会重新起一个新 job
**
** 同步等待到结束（会阻塞，看不到中间过程，只返回最终一行）：
**   dkWaitForJob(h)
**
** Jobs 管理页面（左侧菜单）：ephemeral 也能看到，但这个测试 job 只跑 5 秒，
** 触发后要立刻切过去看，跑完/隔久了可能已经从内存队列里过期看不到了。
**
const class JobExample
{
  static const Str className := JobExample#.name

  ** 实际干活的函数：循环 5 次，每次上报进度、sleep 1 秒
  static Void doTestJob(Str param := "dk")
  {
    try
    {
      5.times |Int i|
      {
        Number percent := Number((i * 100.0f / 5).toInt)
        JobLib.jobProgress(percent, "$param step $i")
        JobLib.jobSleep(Number(1, Unit.fromStr("second")))
      }
      JobLib.jobProgress(Number(100), "done")
    }
    catch (Err e)
    {
      Log.get(className).err("doTestJob failed", e)
      throw e
    }
  }

  ** 方式 A：ephemeral，不落库，直接把 Axon 表达式丢给 jobRun，返回 handle
  static Str runEphemeral(Str param, Context cx := Context.cur)
  {
    JobLib.jobRun(cx.parse("dkTestJob($param.toCode)"))
  }

  ** 同步等待：轮询 jobStatus 直到不是 running，返回最终状态 Grid
  static Grid waitForJob(Str handle)
  {
    Grid g := JobLib.jobStatus(handle)
    while (g.first.trap("jobStatus") == "running")
    {
      Actor.sleep(1sec)
      g = JobLib.jobStatus(handle)
    }
    return g
  }
}
