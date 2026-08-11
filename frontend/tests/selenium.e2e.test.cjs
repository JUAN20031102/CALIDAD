const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CLIENTE_EMAIL = process.env.TEST_CLIENT_EMAIL || 'cliente1@cliente.com';
const CLIENTE_PASSWORD = process.env.TEST_CLIENT_PASSWORD || 'cliente123';

async function crearDriver() {
  const opciones = new chrome.Options();

const chromePath1 = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromePath2 = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

  if (process.platform === 'win32') {
    if (fs.existsSync(chromePath1)) {
      opciones.setChromeBinaryPath(chromePath1);
    } else if (fs.existsSync(chromePath2)) {
      opciones.setChromeBinaryPath(chromePath2);
    }
  }

  const perfilTemporal = fs.mkdtempSync(
    path.join(os.tmpdir(), 'selenium-chrome-')
  );

  opciones.addArguments(`--user-data-dir=${perfilTemporal}`);
  opciones.addArguments('--headless=new');
  opciones.addArguments('--no-sandbox');
  opciones.addArguments('--disable-dev-shm-usage');
  opciones.addArguments('--disable-gpu');
  opciones.addArguments('--remote-debugging-port=0');
  opciones.addArguments('--no-first-run');
  opciones.addArguments('--no-default-browser-check');
  opciones.addArguments('--disable-extensions');
  opciones.addArguments('--disable-notifications');
  opciones.addArguments('--disable-popup-blocking');
  opciones.addArguments('--window-size=1366,768');

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(opciones)
    .build();
}

async function abrir(driver, ruta) {
  await driver.get(`${BASE_URL}${ruta}`);
  await driver.wait(until.elementLocated(By.css('body')), 10000);
}

test('CP-001: La aplicación carga correctamente', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/');

    const titulo = await driver.getTitle();

    assert.strictEqual(titulo, 'Librería MERN - Sistema de Ventas');
  } finally {
    await driver.quit();
  }
});

test('CP-002: La página de login muestra formulario de acceso', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/login');

    const encabezado = await driver.findElement(By.css('h4')).getText();
    const email = await driver.findElement(By.css('input[type="email"]'));
    const password = await driver.findElement(By.css('input[type="password"]'));
    const boton = await driver.findElement(By.css('form button'));

    assert.ok(encabezado.includes('Iniciar sesión'));
    assert.ok(await email.isDisplayed());
    assert.ok(await password.isDisplayed());
    assert.ok((await boton.getText()).includes('Entrar'));
  } finally {
    await driver.quit();
  }
});

test('CP-003: La página de registro muestra formulario de cliente', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/registro');

    const encabezado = await driver.findElement(By.css('h4')).getText();
    const email = await driver.findElement(By.css('input[type="email"]'));
    const password = await driver.findElement(By.css('input[type="password"]'));
    const boton = await driver.findElement(By.css('form button'));

    assert.ok(encabezado.includes('Crear cuenta'));
    assert.ok(await email.isDisplayed());
    assert.ok(await password.isDisplayed());
    assert.ok((await boton.getText()).includes('Registrarme'));
  } finally {
    await driver.quit();
  }
});

test('CP-004: La ruta de libros carga sin romper la aplicación', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/libros');

    const body = await driver.findElement(By.css('body')).getText();

    assert.ok(body.length > 0);
  } finally {
    await driver.quit();
  }
});

test('CP-007: Login valida campos obligatorios', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/login');

    const email = await driver.findElement(By.css('input[type="email"]'));
    const password = await driver.findElement(By.css('input[type="password"]'));
    const boton = await driver.findElement(By.css('form button'));

    await boton.click();

    const emailVacio = await driver.executeScript(
      'return arguments[0].validity.valueMissing;',
      email
    );

    const passwordVacio = await driver.executeScript(
      'return arguments[0].validity.valueMissing;',
      password
    );

    assert.ok(emailVacio);
    assert.ok(passwordVacio);
  } finally {
    await driver.quit();
  }
});

test('CP-008: Usuario sin sesión no puede acceder al administrador', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/admin');

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      const body = await driver.findElement(By.css('body')).getText();

      return (
        url.includes('/login') ||
        body.includes('Iniciar sesión') ||
        body.includes('Acceso denegado') ||
        body.includes('No autorizado')
      );
    }, 10000);

    const url = await driver.getCurrentUrl();
    const body = await driver.findElement(By.css('body')).getText();

    const accesoBloqueado =
      url.includes('/login') ||
      body.includes('Iniciar sesión') ||
      body.includes('Acceso denegado') ||
      body.includes('No autorizado');

    assert.ok(accesoBloqueado);
  } finally {
    await driver.quit();
  }
});

test('CP-005: Login correcto con usuario cliente', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/login');

    const email = await driver.findElement(By.css('input[type="email"]'));
    const password = await driver.findElement(By.css('input[type="password"]'));
    const boton = await driver.findElement(By.css('form button'));

    await email.sendKeys(CLIENTE_EMAIL);
    await password.sendKeys(CLIENTE_PASSWORD);
    await boton.click();

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      const body = await driver.findElement(By.css('body')).getText();

      return (
        !url.includes('/login') ||
        body.includes('Cerrar sesión') ||
        body.includes('Mi carrito') ||
        body.includes('Catálogo') ||
        body.includes('Libros')
      );
    }, 15000);

    const url = await driver.getCurrentUrl();
    const body = await driver.findElement(By.css('body')).getText();

    const loginExitoso =
      !url.includes('/login') ||
      body.includes('Cerrar sesión') ||
      body.includes('Mi carrito') ||
      body.includes('Catálogo') ||
      body.includes('Libros');

    assert.ok(loginExitoso);
  } finally {
    await driver.quit();
  }
});

test('CP-006: Login incorrecto rechaza credenciales inválidas', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/login');

    const email = await driver.findElement(By.css('input[type="email"]'));
    const password = await driver.findElement(By.css('input[type="password"]'));
    const boton = await driver.findElement(By.css('form button'));

    await email.clear();
    await password.clear();

    await email.sendKeys('usuarioincorrecto@test.com');
    await password.sendKeys('claveincorrecta');
    await boton.click();

    await driver.sleep(3000);

    const url = await driver.getCurrentUrl();
    const token = await driver.executeScript(
      'return localStorage.getItem("token");'
    );

    const body = await driver.findElement(By.css('body')).getText();

    const usuarioRechazado =
      url.includes('/login') &&
      (token === null || token === '') &&
      !body.includes('Cerrar sesión');

    assert.ok(usuarioRechazado);
  } finally {
    await driver.quit();
  }
});

test('CP-009: Búsqueda de libros muestra resultados relacionados', async () => {
  const driver = await crearDriver();

  try {
    await abrir(driver, '/libros');

    const buscador = await driver.findElement(By.css('input[type="search"]'));

    await buscador.clear();
    await buscador.sendKeys('Cien Anos de Soledad');

    await driver.wait(async () => {
      const body = await driver.findElement(By.css('body')).getText();

      return (
        body.includes('Cien Anos de Soledad') ||
        body.includes('Gabriel Garcia Marquez')
      );
    }, 15000);

    const body = await driver.findElement(By.css('body')).getText();

    const resultadoEncontrado =
      body.includes('Cien Anos de Soledad') ||
      body.includes('Gabriel Garcia Marquez');

    assert.ok(resultadoEncontrado);
  } finally {
    await driver.quit();
  }
});