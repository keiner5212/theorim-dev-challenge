import boto3
import os
from tabulate import tabulate

CLIENT_ID = "6d1btkbcwmnfguqogvqaz2nzb"
USER_POOL_ID = "local_3ZPKISVm"
cognito = boto3.client("cognito-idp", endpoint_url="http://localhost:9229")


def limpiar_pantalla():
    os.system("cls" if os.name == "nt" else "clear")


def listar_usuarios():
    limpiar_pantalla()
    response = cognito.list_users(UserPoolId=USER_POOL_ID)
    usuarios = response.get("Users", [])

    print(f"\n=== {len(usuarios)} Usuarios Encontrados ===")
    if not usuarios:
        print("No hay usuarios en el grupo.")
    else:
        datos = []
        for u in usuarios:
            username = u["Username"]
            email = next(
                (a["Value"] for a in u["Attributes"] if a["Name"] == "email"), "N/A"
            )
            phone = next(
                (a["Value"] for a in u["Attributes"] if a["Name"] == "phone_number"),
                "N/A",
            )
            status = u.get("UserStatus", "N/A")

            # Obtener grupos del usuario
            try:
                groups_response = cognito.admin_list_groups_for_user(
                    Username=username, UserPoolId=USER_POOL_ID
                )
                groups = ", ".join(
                    [g["GroupName"] for g in groups_response.get("Groups", [])]
                )
            except Exception as e:
                groups = "Error"
            datos.append(
                {
                    "Username": username,
                    "Email": email,
                    "Phone": phone,
                    "Status": status,
                    "Groups": groups,
                }
            )
        print(tabulate(datos, headers="keys", tablefmt="grid"))

    input("\nPresione Enter para continuar...")


def buscar_usuario():
    limpiar_pantalla()
    email = input("Ingrese el correo del usuario: ")
    response = cognito.list_users(UserPoolId=USER_POOL_ID, Filter=f'email = "{email}"')
    usuarios = response.get("Users", [])

    print(f"\n=== {len(usuarios)} Usuarios Encontrados ===")
    if not usuarios:
        print("No se encontraron usuarios con ese email.")
    else:
        datos = []
        for u in usuarios:
            username = u["Username"]
            email = next(
                (a["Value"] for a in u["Attributes"] if a["Name"] == "email"), "N/A"
            )
            phone = next(
                (a["Value"] for a in u["Attributes"] if a["Name"] == "phone_number"),
                "N/A",
            )
            status = u.get("UserStatus", "N/A")

            # Obtener grupos del usuario
            try:
                groups_response = cognito.admin_list_groups_for_user(
                    Username=username, UserPoolId=USER_POOL_ID
                )
                groups = ", ".join(
                    [g["GroupName"] for g in groups_response.get("Groups", [])]
                )
            except Exception as e:
                groups = "Error"
            datos.append(
                {
                    "Username": username,
                    "Email": email,
                    "Phone": phone,
                    "Status": status,
                    "Groups": groups,
                }
            )
        print(tabulate(datos, headers="keys", tablefmt="grid"))

    input("\nPresione Enter para continuar...")


def eliminar_usuario():
    limpiar_pantalla()
    username = input("Ingrese el nombre de usuario a eliminar: ")
    try:
        cognito.admin_delete_user(UserPoolId=USER_POOL_ID, Username=username)
        print("Usuario eliminado exitosamente.")
    except Exception as e:
        print(f"Error eliminando usuario: {e}")
    input("\nPresione Enter para continuar...")


def crear_usuario():
    email = input("Ingrese el correo del nuevo usuario: ")
    password = input("Ingrese la contraseña: ")
    try:
        # Crear el usuario directamente con estado CONFIRMED
        response = cognito.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=email,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "email_verified", "Value": "true"}  # Marcar el email como verificado
            ],
            TemporaryPassword=password,  # Contraseña temporal
            MessageAction='SUPPRESS'  # Suprime el envío de correo de invitación
        )
        print("Usuario creado exitosamente.")

        # Establecer la contraseña permanente
        cognito.admin_set_user_password(
            UserPoolId=USER_POOL_ID,
            Username=email,
            Password=password,
            Permanent=True
        )
        print("Contraseña permanente establecida.")
    except Exception as e:
        print(f"Error creando usuario: {e}")
    input("\nPresione Enter para continuar...")


def modificar_grupo_usuario():
    limpiar_pantalla()
    username = input("Ingrese el nombre de usuario: ")
    group_name = input("Ingrese el nombre del grupo: ")

    print("\n¿Qué desea hacer?")
    print("1. Agregar usuario al grupo")
    print("2. Eliminar usuario del grupo")
    opcion = input("Seleccione una opción: ")

    try:
        if opcion == "1":
            cognito.admin_add_user_to_group(
                UserPoolId=USER_POOL_ID, Username=username, GroupName=group_name
            )
            print(f"Usuario {username} agregado al grupo {group_name} exitosamente.")
        elif opcion == "2":
            cognito.admin_remove_user_from_group(
                UserPoolId=USER_POOL_ID, Username=username, GroupName=group_name
            )
            print(f"Usuario {username} eliminado del grupo {group_name} exitosamente.")
        else:
            print("Opción no válida.")
    except Exception as e:
        print(f"Error modificando el grupo del usuario: {e}")

    input("\nPresione Enter para continuar...")


def crear_grupo():
    limpiar_pantalla()
    group_name = input("Ingrese el nombre del nuevo grupo: ")
    try:
        cognito.create_group(UserPoolId=USER_POOL_ID, GroupName=group_name)
        print(f"Grupo {group_name} creado exitosamente.")
    except Exception as e:
        print(f"Error creando grupo: {e}")
    input("\nPresione Enter para continuar...")


def menu():
    while True:
        limpiar_pantalla()
        print("=== Menú de Administración Cognito ===")
        print("1. Listar usuarios")
        print("2. Buscar usuario")
        print("3. Eliminar usuario")
        print("4. Crear usuario")
        print("5. Modificar grupo de un usuario")
        print("6. Crear grupo")
        print("7. Salir")

        opcion = input("Seleccione una opción: ")
        if opcion == "1":
            listar_usuarios()
        elif opcion == "2":
            buscar_usuario()
        elif opcion == "3":
            eliminar_usuario()
        elif opcion == "4":
            crear_usuario()
        elif opcion == "5":
            modificar_grupo_usuario()
        elif opcion == "6":
            crear_grupo()
        elif opcion == "7":
            break
        else:
            print("Opción no válida, intente de nuevo.")
            input("\nPresione Enter para continuar...")


if __name__ == "__main__":
    menu()
