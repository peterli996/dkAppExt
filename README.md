# **Description**
`dkAppExt` is a minimal-footprint FIN hybrid extension (a single pod) that includes both:

- **Fantom backend skeleton** (`fan/`): `dkAppExt.fan` extension entry point (`onStart`/`onStop` lifecycle) + `dkAppLib.fan` Axon function library
- **React frontend skeleton** (`ts/`): React 18 + TypeScript + React Router + antd, built and packaged into the same pod

It's meant for quickly validating the basic FIN extension development flow (Fantom backend, Axon functions, menu registration, React frontend routing, pod icon configuration, etc.), and can be copied wholesale to bootstrap new extensions.


## **Quick Guides**

---
### **Installing front end dependencies**
#### Requirements
- NodeJS installed on your machine

#### Steps
1. Open a console on the project path (or use the `cd` command to navigate into it)
2. run `npm run-script ci`

---
### **Compiling the code**
#### Requirements:
- FIN installed on your machine
- NodeJS installed on your machine

#### Steps:
1. Stop FIN
2. Open a console on the project path (or use the `cd` command to navigate into it)
3. From the terminal run the following command:
	`<fin-installation-path>\bin\fan build.fan`
4. Restart FIN

This command will compile both the front end and the back end code and output the extension pod directly in the installation, so that it can be used right away when restarting the fin installation.

Example:
If the FIN installation is located in: `c:\fin`
The command will be:
	`c:\fin\bin\fan build.fan`

---
### **Installing the extension in your FIN installation**
1. Stop your FIN installation
2. Place the extension pod file inside the `<fin-installation-path>\lib\fan` folder in your FIN installation.
3. Restart your FIN installation

---
### **Running a development server**
#### Requirements
- FIN installed on your machine
- NodeJS installed on your machine

#### Steps
1. Start FIN in noAuth mode: `bin\fin -noAuth`
2. Run from terminal:
	`npm start`
3. Navigate with your browser to the address indicated in the console. (Typically `127.0.0.1:8081`)
4. Make sure to add the needed parameters to the URL, like `projectName` which needs to be set since the pages can't retrieve it from the upper frame context. So for example: `127.0.0.1:8081/#projectName=demo`

