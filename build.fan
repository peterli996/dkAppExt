using finBuild

class Args : BuildFinArgs {
  new make() : super(Build#make) {}
}

class Build : BuildFinPod {

  new make(Args args) : super(args) {
    podName = "dkAppExt"
    summary = "dk的测试ext"
    version = Version("0.0.1")

    meta = [
      "proj.name":       podName,
      "org.name":        "J2 Innovations",
      "org.uri":         "http://www.j2inn.com/",
      "license.name":    "Commercial",
      "pod.docLocation": "finDoc",
    ]

    depends = [
      // Fantom
      "sys        1.0",
      "concurrent 1.0",

      // SS Framework
      "skyarcd          3.0.20+",
      "axon             3.0.20+",
      "connExt          3.0.20+",
      "controlExt       3.0.20+",
      "folio            3.0.20+",
      "haystack         3.0.20+",
      "skyarc           3.0.20+",
      "jobExt           3.0.20+",
    ]

    srcDirs = [
      `fan/`,
      `fan/observers/`,
      `fan/alarmTemplate/`,
      `fan/jobs/`,
      `test/`
    ]
    resDirs = [
      `lib/`,
      `locale/`,
      `res/`,
      `res/programTemplates/`,
      // 外部匿名直接访问入口（/pod/dkAppExt/res/app/index.html），见 ts/scripts/syncRes.js
      // Vite 产物统一放在单一 assets/ 目录下（不再有 webpack 时代的 assets/js/ 嵌套）
      `res/app/`,
      `res/app/assets/`,
      `images/`,
    ]
    nodeDirs = [`ts/`]
    index   = [
      "skyarc.ext": "dkAppExt::dkAppExt",
      "skyarc.lib": "dkAppExt::dkAppLib",
      "fin.lang": "dkAppExt", // Extension with this property will be searched for locale props files by FIN
    ]
  }
}
