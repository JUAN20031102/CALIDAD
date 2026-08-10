# Entrenamiento de modelos de Machine Learning para la Libreria.
# Lee el dataset CSV generado por el backend de Node, entrena modelos
# de regresion y clasificacion con scikit-learn, los guarda (joblib) y
# emite un JSON con las metricas y el avance del entrenamiento.
import argparse
import json
import os
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

FEATURES_CAT = ['PROFESION', 'FRECUENCIA_LECTURA', 'CAT1', 'CAT2', 'CAT3', 'AUT1', 'AUT2', 'AUT3']
FEATURES_NUM = ['EDAD']


def escribir_progreso(path, etapa, pct, mensaje=""):
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump({'entrenando': True, 'etapa': etapa, 'porcentaje': pct, 'mensaje': mensaje}, f)
    except Exception:
        pass


def generar_preprocesador():
    return ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), FEATURES_CAT),
            ('num', 'passthrough', FEATURES_NUM),
        ]
    )


def preparar_x(df):
    X = df[FEATURES_CAT + FEATURES_NUM].copy().reset_index(drop=True)
    for c in FEATURES_CAT:
        X[c] = X[c].fillna('').astype(str)
    X[FEATURES_NUM] = X[FEATURES_NUM].astype(float)
    return X


def entrena_regresion(X, y, semilla):
    pipe = Pipeline(steps=[
        ('pre', generar_preprocesador()),
        ('modelo', RandomForestRegressor(n_estimators=200, random_state=semilla)),
    ])
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=semilla)
    pipe.fit(Xtr, ytr)
    pred = pipe.predict(Xte)
    metricas = {
        'r2': float(r2_score(yte, pred)),
        'mae': float(mean_absolute_error(yte, pred)),
    }
    return pipe, metricas


def entrena_clasificacion(X, y, semilla):
    pipe = Pipeline(steps=[
        ('pre', generar_preprocesador()),
        ('modelo', LogisticRegression(max_iter=2000, class_weight='balanced', random_state=semilla)),
    ])
    cuenta = y.value_counts()
    stratify = y if cuenta.min() >= 2 else None
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=semilla, stratify=stratify)
    pipe.fit(Xtr, ytr)
    pred = pipe.predict(Xte)
    labels = list(np.unique(y))
    acc = float(accuracy_score(yte, pred))
    macro = float(f1_score(yte, pred, labels=labels, average='macro', zero_division=0))
    return pipe, {'accuracy': acc, 'macro_f1': macro}


def guardar_modelo(path, pipe):
    joblib.dump({'pipeline': pipe, 'features_cat': FEATURES_CAT, 'features_num': FEATURES_NUM}, path)


def cargar_pipeline(path):
    if os.path.exists(path):
        return joblib.load(path)['pipeline']
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--progress', required=True)
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    p = args.progress

    escribir_progreso(p, 'cargando_datos', 5, 'Leyendo datos de clientes...')
    df = pd.read_csv(args.csv, dtype=str)

    escribir_progreso(p, 'preprocesamiento', 15, 'Preparando características...')
    df['EDAD'] = pd.to_numeric(df['EDAD'], errors='coerce')
    df['EDAD'] = df['EDAD'].fillna(df['EDAD'].median())
    for c in ['GASTO_TOTAL', 'TOTAL_LIBROS']:
        df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)
    for c in FEATURES_CAT + ['NIVEL_GASTO', 'NIVEL_LECTURA', 'CATEGORIA_COMPRA', 'AUTOR_COMPRA']:
        if c in df.columns:
            df[c] = df[c].fillna('').astype(str)

    X = preparar_x(df)
    semilla = 42
    resultados = {}

    # 1) Gasto total (regresion)
    escribir_progreso(p, 'entrenando', 30, 'Entrenando modelo de gasto total...')
    y = df['GASTO_TOTAL'].astype(float)
    pipe, m = entrena_regresion(X, y, semilla)
    guardar_modelo(os.path.join(args.out, 'modelo_gasto.joblib'), pipe)
    resultados['gasto'] = {'tipo': 'regresion', **m}

    # 2) Cantidad de libros (regresion)
    escribir_progreso(p, 'entrenando', 45, 'Entrenando modelo de cantidad de libros...')
    y = df['TOTAL_LIBROS'].astype(float)
    pipe, m = entrena_regresion(X, y, semilla)
    guardar_modelo(os.path.join(args.out, 'modelo_libros.joblib'), pipe)
    resultados['libros'] = {'tipo': 'regresion', **m}

    # 3) Nivel de gasto (clasificacion)
    escribir_progreso(p, 'entrenando', 60, 'Clasificando nivel de gasto...')
    mask = df['NIVEL_GASTO'] != ''
    if mask.sum() >= 10:
        pipe, m = entrena_clasificacion(X[mask], df.loc[mask, 'NIVEL_GASTO'], semilla)
        guardar_modelo(os.path.join(args.out, 'modelo_nivel_gasto.joblib'), pipe)
        resultados['nivel_gasto'] = {'tipo': 'clasificacion', **m}
    else:
        resultados['nivel_gasto'] = {'tipo': 'clasificacion', 'error': 'datos_insuficientes'}

    # 4) Nivel de lectura (clasificacion)
    escribir_progreso(p, 'entrenando', 75, 'Clasificando nivel de lectura...')
    mask = df['NIVEL_LECTURA'] != ''
    if mask.sum() >= 10:
        pipe, m = entrena_clasificacion(X[mask], df.loc[mask, 'NIVEL_LECTURA'], semilla)
        guardar_modelo(os.path.join(args.out, 'modelo_nivel_lectura.joblib'), pipe)
        resultados['nivel_lectura'] = {'tipo': 'clasificacion', **m}
    else:
        resultados['nivel_lectura'] = {'tipo': 'clasificacion', 'error': 'datos_insuficientes'}

    # 5) Categoria de compra probable (clasificacion)
    escribir_progreso(p, 'entrenando', 85, 'Clasificando categoría de compra probable...')
    mask = df['CATEGORIA_COMPRA'] != ''
    if mask.sum() >= 10:
        pipe, m = entrena_clasificacion(X[mask], df.loc[mask, 'CATEGORIA_COMPRA'], semilla)
        guardar_modelo(os.path.join(args.out, 'modelo_categoria.joblib'), pipe)
        resultados['categoria'] = {'tipo': 'clasificacion', **m}
    else:
        resultados['categoria'] = {'tipo': 'clasificacion', 'error': 'datos_insuficientes'}

    # 6) Autor probable (clasificacion)
    escribir_progreso(p, 'entrenando', 92, 'Clasificando autor probable...')
    mask = df['AUTOR_COMPRA'] != ''
    if mask.sum() >= 10:
        pipe, m = entrena_clasificacion(X[mask], df.loc[mask, 'AUTOR_COMPRA'], semilla)
        guardar_modelo(os.path.join(args.out, 'modelo_autor.joblib'), pipe)
        resultados['autor'] = {'tipo': 'clasificacion', **m}
    else:
        resultados['autor'] = {'tipo': 'clasificacion', 'error': 'datos_insuficientes'}

    # Predicciones de entrenamiento para el dashboard
    escribir_progreso(p, 'guardando', 97, 'Guardando modelos y métricas...')
    preds = pd.DataFrame({'NOMBRE': df['NOMBRE'], 'EMAIL': df['EMAIL']})

    def predecir(nombre_modelo, col):
        pipe = cargar_pipeline(os.path.join(args.out, nombre_modelo))
        if pipe is None:
            preds[col] = ''
        else:
            preds[col] = pipe.predict(X)

    predecir('modelo_gasto.joblib', 'GASTO_PRED')
    predecir('modelo_libros.joblib', 'LIBROS_PRED')
    predecir('modelo_categoria.joblib', 'CATEGORIA_PRED')
    predecir('modelo_autor.joblib', 'AUTOR_PRED')
    predecir('modelo_nivel_gasto.joblib', 'NIVEL_GASTO_PRED')
    predecir('modelo_nivel_lectura.joblib', 'NIVEL_LECTURA_PRED')
    preds.to_csv(os.path.join(args.out, 'predicciones.csv'), index=False, encoding='utf-8-sig')

    resumen = {
        'entrenado': True,
        'n_clientes': int(len(df)),
        'n_features': int(len(FEATURES_CAT) + len(FEATURES_NUM)),
        'fecha': pd.Timestamp.now().isoformat(),
        'modelos': list(resultados.keys()),
        **resultados,
    }
    escribir_progreso(p, 'completado', 100, 'Entrenamiento completado')
    print(json.dumps(resumen))


if __name__ == '__main__':
    main()
