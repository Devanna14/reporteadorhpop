import { useState, useEffect, JSX } from 'react'
import logoCompleto from './assets/logo20.png'

interface Registro {
  Ingreso: string
  Responsable: string
  Campo1: string
  Status: string
  Entrada: string
  Salida: string
}

function App(): JSX.Element {
  const [conteo, setConteo] = useState()
  const [listaAnios, setListaAnios] = useState<number[]>([]) // Años desde SQL
  const [anio, setAnio] = useState<number>(new Date().getFullYear()) // Año seleccionado
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(1)
  const [datos, setDatos] = useState<Registro[]>([])

  const meses = [
    { id: 1, label: 'EN', nombre: 'ENERO' },
    { id: 2, label: 'FE', nombre: 'FEBRERO' },
    { id: 3, label: 'MA', nombre: 'MARZO' },
    { id: 4, label: 'AB', nombre: 'ABRIL' },
    { id: 5, label: 'MA', nombre: 'MAYO' },
    { id: 6, label: 'JU', nombre: 'JUNIO' },
    { id: 7, label: 'JUL', nombre: 'JULIO' },
    { id: 8, label: 'AG', nombre: 'AGOSTO' },
    { id: 9, label: 'SE', nombre: 'SEPTIEMBRE' },
    { id: 10, label: 'OC', nombre: 'OCTUBRE' },
    { id: 11, label: 'NO', nombre: 'NOVIEMBRE' },
    { id: 12, label: 'DIC', nombre: 'DICIEMBRE' }
  ]

  // Función para cargar los años disponibles
  const cargarAniosDisponibles = async () => {
    const anios = (await window.electron.ipcRenderer.invoke('obtener-anios')) as number[]
    setListaAnios(anios)

    // Si el año actual no está en la lista, seleccionamos el primero disponible
    if (anios.length > 0 && !anios.includes(anio)) {
      setAnio(anios[0])
    }
  }

  useEffect(() => {
    cargarAniosDisponibles()
  }, []) // Solo al montar la app

  const cargarDetalleIngresos = async () => {
    console.log('Pidiendo datos para:', anio, mesSeleccionado)
    const res = (await window.electron.ipcRenderer.invoke('obtener-detalle-ingresos', {
      anio,
      mes: mesSeleccionado
    })) as Registro[]
    setDatos(res)
    setConteo(res.length)
  }

  // la tabla se limpia y trae los datos nuevos automáticamente.
  useEffect(() => {
    cargarDetalleIngresos()
  }, [anio, mesSeleccionado])

  return (
    <div style={styles.appContainer}>
      {/* Header */}
      <header style={styles.header}>
        <img
          src={logoCompleto}
          alt="Logo Hydraulic & Pneumatic - Reporteador"
          style={{ height: '80px', width: 'auto' }} // Ajusta la altura aquí para que se vea bien
        />
        <div style={styles.filterGroup}>
          <label>Filtro por año</label>
          <select
            style={styles.select}
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          >
            {/* AQUÍ CARGAMOS LOS AÑOS DE LA DB */}
            {listaAnios.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Body */}
      <main style={styles.mainContent}>
        {/* Sidebar de Meses */}
        <aside style={styles.sidebar}>
          <div style={styles.monthGrid}>
            {meses.map((m) => (
              <button
                key={m.id}
                onClick={() => setMesSeleccionado(m.id)}
                style={{
                  ...styles.monthBtn,
                  backgroundColor: mesSeleccionado === m.id ? '#00d8ff' : '#2d2d44',
                  color: mesSeleccionado === m.id ? '#000' : '#fff'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Área de Tabla */}
        <section style={styles.tableArea}>
          <h2 style={styles.tableTitle}>
            INGRESOS DE {meses.find((m) => m.id === mesSeleccionado)?.nombre} {anio} {conteo ? `- Total: ${conteo}` : ''}
          </h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Ingreso</th>
                  <th>Responsable</th>
                  <th>Estación</th>
                  <th>Status</th>
                  <th>Salida</th>
                </tr>
              </thead>
              <tbody>
                {datos && datos.length > 0 ? (
                  datos.map((row, i) => (
                    <tr key={i} style={i % 2 === 0 ? { backgroundColor: '#ffffff05' } : {}}>
                      <td style={{ padding: '10px' }}>{row.Ingreso}</td>
                      <td>{row.Responsable}</td>
                      <td>{row.Campo1}</td>
                      <td>{row.Status}</td>
                      <td>
                        {row.Salida
                          ? new Date(row.Salida).toLocaleString('es-MX', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'S/N'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                      No se encontraron registros para{' '}
                      {meses.find((m) => m.id === mesSeleccionado)?.nombre} {anio}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    backgroundColor: '#14141d31',
    color: '#fff',
    width: '100vw',
    maxHeight: '100vh',
    padding: '20px',
    fontFamily: 'Inter, system-ui'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  logo: { fontSize: '28px', margin: 0 },
  filterGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#1e1e2f',
    color: '#fff'
  },
  mainContent: { display: 'grid', gridTemplateColumns: '150px 1fr', gap: '30px' },
  sidebar: {
    backgroundColor: '#1e1e2f',
    padding: '15px',
    borderRadius: '16px',
    height: 'fit-content',
    border: '1px solid #333'
  },
  monthGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  monthBtn: {
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s'
  },
  tableArea: {
    backgroundColor: '#1e1e2f',
    padding: '25px',
    borderRadius: '20px',
    border: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 120px)',
    overflow: 'hidden'
  },
  tableTitle: {
    fontSize: '18px',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: '20px',
    letterSpacing: '2px',
    color: '#00d8ff'
  },
  tableWrapper: {
    overflowY: 'auto',
    overflowX: 'auto',
    flex: 1,
    marginTop: '10px',
    paddingRight: '5px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left',
    position: 'relative'
  }
}

export default App
