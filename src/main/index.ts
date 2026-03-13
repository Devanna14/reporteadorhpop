import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import sql from 'mssql'
import 'dotenv/config'

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true }
}

// interface ResumenIngreso {
//   mes: number
//   total: number
// }

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 3. Inicialización de la App
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('obtener-detalle-ingresos', async (_event, { anio, mes }): Promise<any[]> => {
    try {
      let pool = await sql.connect(dbConfig)
      const result = await pool.request().input('anio', sql.Int, anio).input('mes', sql.Int, mes)
        .query(`
        SELECT 
          db_owner.Ingresos.Ingreso, 
          db_owner.Responsables.Responsable, 
          db_owner.EstadoDelPedido.Campo1, 
          db_owner.Status.Status, 
          db_owner.t_Tiempo_XEstacion.Entrada, 
          db_owner.t_Tiempo_XEstacion.Salida
        FROM db_owner._Planeacion 
        INNER JOIN db_owner.t_Tiempo_XEstacion ON db_owner._Planeacion.Ingreso = db_owner.t_Tiempo_XEstacion.Ingreso 
        INNER JOIN db_owner.Status ON db_owner.t_Tiempo_XEstacion.Estacion = db_owner.Status.id_Status 
        INNER JOIN db_owner.Responsables ON db_owner.t_Tiempo_XEstacion.Resp = db_owner.Responsables.id 
        INNER JOIN db_owner.Ingresos ON db_owner.t_Tiempo_XEstacion.Ingreso = db_owner.Ingresos.Ingreso 
        INNER JOIN db_owner.EstadoDelPedido ON db_owner.Ingresos.Programado = db_owner.EstadoDelPedido.Id
        WHERE (db_owner._Planeacion.[acabado y revision] = 1) 
          AND (db_owner.t_Tiempo_XEstacion.Estacion = 65)
          AND YEAR(db_owner.t_Tiempo_XEstacion.Salida) = @anio
          AND MONTH(db_owner.t_Tiempo_XEstacion.Salida) = @mes
        ORDER BY db_owner.t_Tiempo_XEstacion.Salida
      `)
      return result.recordset
    } catch (err) {
      console.error('Error en SQL:', err)
      return []
    }
  })

  ipcMain.handle('obtener-anios', async () => {
    try {
      let pool = await sql.connect(dbConfig)
      const result = await pool.request().query(`
        SELECT YEAR(Salida) AS Anio
        FROM db_owner.t_Tiempo_XEstacion
        WHERE (Estacion = 65)
        GROUP BY YEAR(Salida)
        ORDER BY Anio DESC
      `)
      return result.recordset.map((row) => row.Anio)
    } catch (err) {
      console.error('Error al obtener años:', err)
      return []
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
