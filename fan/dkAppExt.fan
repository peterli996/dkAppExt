using haystack
using skyarc
using skyarcd


@ExtMeta
{
  name    = "dkAppExt"
  icon  = "dkLogo" //取自uiIcons.pod的svg
}

const class dkAppExt : Ext {

  static dkAppExt cur() { Context.cur.proj.ext("dkAppExt") }

  override Void onStart() {

  }

  override Void onStop() {

  }
}