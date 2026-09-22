using haystack
using folio
using skyarcd

**
** 告警程序模板：列出模板、按参数创建程序记录
**
** 模板放在 res/programTemplates/*.trio，里面用 Arg("名字:默认值") 标出可替换的参数。
** 只实现了 Arg 替换；Transient / Walk 没做，也不处理 programSource。
**
const class AlarmTemplateHandler
{
  private static const Str templatesPath := "/res/programTemplates/"

  ** 列出所有模板：name / description / args（每个参数的 "名字:默认值" 原文）
  static Dict[] list()
  {
    return templateFiles.map |File f->Dict|
    {
      tpl := readTemplate(f)
      return Etc.makeDict([
        "name":        f.basename,
        "description": tpl["description"],
        "args":        argSpecs(tpl),
      ])
    }
  }

  ** 按模板和参数创建程序记录并提交，返回新记录
  static Dict create(Context cx, Str templateName, Dict args)
  {
    file := templateFiles.find |File f->Bool| { f.basename == templateName }
    if (file == null) throw ArgErr("Unknown template: $templateName")

    tpl := readTemplate(file)
    rec := Etc.dictMap(tpl) |Obj? v, Str n->Obj?|
    {
      if (n == "programVars") return resolveProgramVars((Str)v, args)
      return resolveArg(v, args, null)
    }
    diff := cx.proj.commit(Diff.makeAdd(rec))
    return diff.newRec
  }

  //////////////////////////////////////////////////////////////////////////
  // 模板文件
  //////////////////////////////////////////////////////////////////////////

  private static File[] templateFiles()
  {
    return AlarmTemplateHandler#.pod.files.findAll |File f->Bool|
    {
      f.uri.pathStr.startsWith(templatesPath) && f.ext == "trio"
    }
  }

  private static Dict readTemplate(File f)
  {
    return TrioReader(f.in).readAllDicts.first
  }

  //////////////////////////////////////////////////////////////////////////
  // Arg 替换
  //////////////////////////////////////////////////////////////////////////

  ** 把 Arg("name") / Arg("name:默认值") 换成实际值，其他值原样返回
  ** kind 用来把默认值文本转成对应类型（Number / Bool / Str）
  private static Obj? resolveArg(Obj? v, Dict args, Str? kind)
  {
    x := v as XStr
    if (x == null || x.type != "Arg") return v

    Str argName := x.val
    Str? dflt := null
    i := x.val.index(":")
    if (i != null)
    {
      argName = x.val[0..<i]
      dflt    = x.val[i+1..-1]
    }

    if (args.has(argName)) return args[argName]
    if (dflt != null)      return parseDefault(dflt, kind)
    throw ArgErr("Missing required arg: $argName")
  }

  private static Obj parseDefault(Str s, Str? kind)
  {
    switch (kind)
    {
      case "Number": return Number.fromStr(s)
      case "Bool":   return s.toBool
      default:       return s
    }
  }

  ** programVars 是一段 zinc 文本：解析成 grid，替换每一格里的 Arg，再写回文本
  private static Str resolveProgramVars(Str zinc, Dict args)
  {
    grid := ZincReader(zinc.in).readGrid
    gb := GridBuilder()
    grid.cols.each |Col c| { gb.addCol(c.name) }
    grid.each |Row row|
    {
      cells := grid.cols.map |Col c->Obj?|
      {
        Str? kind := null
        if (c.name == "defVal") kind = row["kind"] as Str
        return resolveArg(row[c.name], args, kind)
      }
      gb.addRow(cells)
    }
    return ZincWriter.gridToStr(gb.toGrid)
  }

  ** 收集模板里所有 Arg 的原文，用于列表展示
  private static Str[] argSpecs(Dict tpl)
  {
    specs := Str[,]
    tpl.each |Obj? v, Str n|
    {
      if (n == "programVars")
        ZincReader(((Str)v).in).readGrid.each |Row row| { row.each |Obj? cv| { addSpec(specs, cv) } }
      else
        addSpec(specs, v)
    }
    return specs
  }

  private static Void addSpec(Str[] specs, Obj? v)
  {
    x := v as XStr
    if (x != null && x.type == "Arg") specs.add(x.val)
  }
}
