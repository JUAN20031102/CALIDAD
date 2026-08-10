# Prediccion para un nuevo cliente usando los modelos entrenados.
# Recibe --modelos (dir), --input (json con datos del cliente) y
# --libros (json con el catalogo para recomendaciones). Emite JSON a stdout.
import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd

FEATURES_CAT = ['PROFESION', 'FRECUENCIA_LECTURA', 'CAT1', 'CAT2', 'CAT3', 'AUT1', 'AUT2', 'AUT3']
FEATURES_NUM = ['EDAD']


def cargar(path):
    if os.path.exists(path):
        data = joblib.load(path)
        return data['pipeline'], data['features_cat'], data['features_num']
    return None, None, None


def construir_fila(cliente):
    cats = (cliente.get('categorias') or [])[:3]
    auts = (cliente.get('autores') or [])[:3]
    fila = {
        'PROFESION': cliente.get('profesion') or '',
        'FRECUENCIA_LECTURA': cliente.get('frecuenciaLectura') or '',
        'CAT1': (cats[0] if len(cats) > 0 else ''),
        'CAT2': (cats[1] if len(cats) > 1 else ''),
        'CAT3': (cats[2] if len(cats) > 2 else ''),
        'AUT1': (auts[0] if len(auts) > 0 else ''),
        'AUT2': (auts[1] if len(auts) > 1 else ''),
        'AUT3': (auts[2] if len(auts) > 2 else ''),
        'EDAD': float(cliente.get('edad') or 30),
    }
    return pd.DataFrame([fila])[FEATURES_CAT + FEATURES_NUM]


def top_clases(pipe, fila, n=3):
    try:
        proba = pipe.predict_proba(fila)[0]
    except Exception:
        return []
    indices = np.argsort(proba)[::-1][:n]
    clases = pipe.classes_
    return [{'valor': str(clases[i]), 'probabilidad': float(round(proba[i], 4))} for i in indices]


def recomendar(cliente, libros, categoria_pred, autor_pred, n=6):
    cats_cliente = set(cliente.get('categorias') or [])
    autores_cliente = set(cliente.get('autores') or [])
    if libros is None:
        return []
    max_pop = max((l.get('popularidad') or 0) for l in libros) or 1

    puntuados = []
    for l in libros:
        score = 0.0
        cat = l.get('categoria') or ''
        autor = l.get('autor') or ''
        if cat and cat == categoria_pred:
            score += 1.5
        if cat and cat in cats_cliente:
            score += 1.0
        if autor and autor in autores_cliente:
            score += 1.5
        if autor and autor == autor_pred:
            score += 1.0
        score += 0.4 * ((l.get('popularidad') or 0) / max_pop)
        if score > 0:
            puntuados.append((score, l))

    puntuados.sort(key=lambda x: -x[0])
    resultado = []
    for score, l in puntuados[:n]:
        resultado.append({
            'titulo': l.get('titulo'),
            'autor': l.get('autor'),
            'categoria': l.get('categoria'),
            'precio': l.get('precio'),
            'portada': l.get('portada'),
            'popularidad': l.get('popularidad') or 0,
            'puntaje': float(round(score, 3)),
        })

    if not resultado:
        top = sorted(libros, key=lambda x: -(x.get('popularidad') or 0))[:n]
        resultado = [{
            'titulo': l.get('titulo'), 'autor': l.get('autor'), 'categoria': l.get('categoria'),
            'precio': l.get('precio'), 'portada': l.get('portada'),
            'popularidad': l.get('popularidad') or 0, 'puntaje': 0.0,
        } for l in top]
    return resultado


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--modelos', required=True)
    parser.add_argument('--input', required=True)
    parser.add_argument('--libros', required=True)
    args = parser.parse_args()

    with open(args.input, 'r', encoding='utf-8') as f:
        cliente = json.load(f)

    libros = None
    if os.path.exists(args.libros):
        with open(args.libros, 'r', encoding='utf-8') as f:
            libros = json.load(f)

    fila = construir_fila(cliente)

    gasto_pipe, _, _ = cargar(os.path.join(args.modelos, 'modelo_gasto.joblib'))
    libros_pipe, _, _ = cargar(os.path.join(args.modelos, 'modelo_libros.joblib'))
    cat_pipe, _, _ = cargar(os.path.join(args.modelos, 'modelo_categoria.joblib'))
    autor_pipe, _, _ = cargar(os.path.join(args.modelos, 'modelo_autor.joblib'))
    ng_pipe, _, _ = cargar(os.path.join(args.modelos, 'modelo_nivel_gasto.joblib'))
    nl_pipe, _, _ = cargar(os.path.join(args.modelos, 'modelo_nivel_lectura.joblib'))

    def predecir_num(pipe):
        if pipe is None:
            return 0.0
        return float(pipe.predict(fila)[0])

    def predecir_clase(pipe):
        if pipe is None:
            return ''
        return str(pipe.predict(fila)[0])

    resultado = {
        'gasto_estimado': round(predecir_num(gasto_pipe), 2),
        'libros_estimados': max(int(round(predecir_num(libros_pipe))), 0),
        'categoria_probable': top_clases(cat_pipe, fila)[0] if cat_pipe is not None else {'valor': '', 'probabilidad': 0.0},
        'categorias_top': top_clases(cat_pipe, fila, 3) if cat_pipe is not None else [],
        'autor_probable': top_clases(autor_pipe, fila)[0] if autor_pipe is not None else {'valor': '', 'probabilidad': 0.0},
        'autores_top': top_clases(autor_pipe, fila, 3) if autor_pipe is not None else [],
        'nivel_gasto': predecir_clase(ng_pipe),
        'nivel_lectura': predecir_clase(nl_pipe),
    }

    cat_pred = resultado['categoria_probable']['valor'] if resultado['categoria_probable'] else ''
    autor_pred = resultado['autor_probable']['valor'] if resultado['autor_probable'] else ''
    resultado['recomendaciones'] = recomendar(cliente, libros, cat_pred, autor_pred)

    print(json.dumps(resultado))


if __name__ == '__main__':
    main()
