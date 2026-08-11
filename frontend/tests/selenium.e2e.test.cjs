const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function crearDriver() {
  const opciones = new chrome.Options();

  const chromePath1 = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromePath2 = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

  if (fs.existsSync(chromePath1)) {
    opciones.setChromeBinaryPath(chromePath1);
  } else if (fs.existsSync(chromePath2)) {
    opciones.setChromeBinaryPath(chromePath2);
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