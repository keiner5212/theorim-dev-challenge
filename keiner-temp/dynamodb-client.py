import boto3
import os
import json
from tabulate import tabulate
from collections import defaultdict


dynamodb = boto3.resource("dynamodb", endpoint_url="http://localhost:8000")
TABLE_NAME = "jschema"
table = dynamodb.Table(TABLE_NAME)

def truncar_texto(texto, longitud=30):
    return (texto[:longitud] + "...") if isinstance(texto, str) and len(texto) > longitud else texto

def limpiar_pantalla():
    os.system("cls" if os.name == "nt" else "clear")

def obtener_columnas_importantes(item):
    columnas = [col for col in item.keys() if col not in ["pk", "sk"]]
    return ["pk", "sk"] + columnas[:3]

def mostrar_todos():
    limpiar_pantalla()
    response = table.scan()
    items = response.get("Items", [])

    print(f"\n=== {len(items)} Resultados ===")
    if not items:
        print("No hay elementos en la tabla.")
        input("\nPresione Enter para continuar...")
        return

    grupos = defaultdict(list)
    for item in items:
        pk = item.get("pk", "Sin PK")
        grupos[pk].append(item)

    print(f"\n=== {len(grupos)} Grupos ===")
    for sk, group in grupos.items():
        print(f"\n=== Grupo PK: {sk} ===")
        columnas_importantes = obtener_columnas_importantes(group[0])
        datos_mostrados = [{col: truncar_texto(item.get(col, "")) for col in columnas_importantes} for item in group]
        print(tabulate(datos_mostrados, headers="keys", tablefmt="grid"))
    
    input("\nPresione Enter para continuar...")

def buscar():
    limpiar_pantalla()
    campo = input("Ingrese el campo a buscar (sk, pk,...): ")
    valor = input("Ingrese el valor a buscar: ")
    response = table.scan()
    items = [item for item in response.get("Items", []) if str(item.get(campo, "")) == valor]
    print(f"\n=== {len(items)} Resultados ===")
    if items:
        columnas_importantes = obtener_columnas_importantes(items[0])
        datos_mostrados = [{col: truncar_texto(item.get(col, "")) for col in columnas_importantes} for item in items]
        print(tabulate(datos_mostrados, headers="keys", tablefmt="grid"))
    else:
        print("No se encontraron resultados.")
    input("\nPresione Enter para continuar...")

def eliminar():
    limpiar_pantalla()
    campo = input("Ingrese el campo a buscar (sk, pk,...): ")
    valor = input("Ingrese el valor a buscar: ")
    response = table.scan()
    items = [item for item in response.get("Items", []) if str(item.get(campo, "")) == valor]
    print(f"\n=== {len(items)} Resultados ===")
    if not items:
        print("No se encontraron elementos para eliminar.")
    else:
        columnas_importantes = obtener_columnas_importantes(items[0])
        datos_mostrados = [{col: truncar_texto(item.get(col, "")) for col in columnas_importantes} for item in items]
        print(tabulate(datos_mostrados, headers="keys", tablefmt="grid"))
        confirmar = input("¿Desea eliminar estos elementos? (s/n): ").strip().lower()
        if confirmar in ["s", "si", "y", "yes"]:
            for item in items:
                table.delete_item(Key={"pk": item["pk"], "sk": item["sk"]})
                print("Elemento eliminado:", item["pk"], item["sk"])
        else:
            print("Operación cancelada.")
    input("\nPresione Enter para continuar...")

def crear():
    limpiar_pantalla()
    item = {}
    print("Ingrese los datos del nuevo elemento (campo=valor). Deje vacío para finalizar.")
    while True:
        dato = input("Dato: ")
        if not dato:
            break
        clave, valor = dato.split("=")
        item[clave.strip()] = valor.strip()
    table.put_item(Item=item)
    print("Elemento creado exitosamente.")
    input("\nPresione Enter para continuar...")

def leer_y_añadir_desde_json():
    limpiar_pantalla()
    ruta = input("Ingrese la ruta del archivo JSON: ")
    if not os.path.exists(ruta):
        print("El archivo no existe.")
        input("\nPresione Enter para continuar...")
        return
    
    with open(ruta, "r", encoding="utf-8") as file:
        try:
            data = json.load(file)
            if not isinstance(data, list):
                print("El archivo JSON debe contener una lista de objetos.")
                input("\nPresione Enter para continuar...")
                return
            
            for item in data:
                if "pk" in item and "sk" in item:
                    table.put_item(Item=item)
                    print(f"Elemento añadido: {item['pk']} - {item['sk']}")
                else:
                    print("Elemento inválido (falta pk o sk):", item)
        except json.JSONDecodeError:
            print("Error al leer el archivo JSON. Verifique su formato.")
    
    input("\nPresione Enter para continuar...")

def menu():
    while True:
        limpiar_pantalla()
        print("=== Menú de Administración DynamoDB ===")
        print("1. Mostrar todos")
        print("2. Buscar")
        print("3. Eliminar")
        print("4. Crear")
        print("5. Leer y añadir desde JSON")
        print("6. Salir")
        opcion = input("Seleccione una opción: ")
        if opcion == "1":
            mostrar_todos()
        elif opcion == "2":
            buscar()
        elif opcion == "3":
            eliminar()
        elif opcion == "4":
            crear()
        elif opcion == "5":
            leer_y_añadir_desde_json()
        elif opcion == "6":
            break
        else:
            print("Opción no válida, intente de nuevo.")
            input("\nPresione Enter para continuar...")

if __name__ == "__main__":
    menu()
