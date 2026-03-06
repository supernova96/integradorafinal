use anchor_lang::prelude::*;
// ID del Solana Program, este espacio se llena automaticamente al haver el "build"
declare_id!("");

#[program] // Macro que convierte codigo de Rust a Solana. Apartir de aqui empieza tu codigo!
pub mod labmanager {
    use super::*; // Importa todas los structs y enums definidos fuera del modulo

    //////////////////////////// Instruccion: Crear Laboratorio /////////////////////////////////////
    /*
    Permite la creacion de una PDA (Program Derived Adress), un tipo especial de cuenta en solana que permite prescindir 
    Esta cuenta contendra el objeto (struct) de tipo Laboratorio donde podremos almacenar las Laptops. 
    Ademas, el laboratorio tendra una capacidad maxima definida al crearse, aportando mayor logica de negocio.
    La creacion de la PDA depende de 3 cosas:
        * Wallet address 
        * Program ID 
        * string representativo, regularmente relacionado con el nombre del proyecto
    
    La explicacion de esto continua en el struct NuevoLaboratorio

    Parametros de entrada:
        * nombre -> nombre del laboratorio -> tipo string
        * capacidad_maxima -> cupo limite de laptops -> u8
     */
    pub fn crear_laboratorio(context: Context<NuevoLaboratorio>, nombre: String, capacidad_maxima: u8) -> Result<()> {
        // Validacion crucial: El espacio on-chain pagado soporta 50 structs como maximo (fijado por max_len)
        require!(
            capacidad_maxima <= 50,
            Errores::CapacidadInvalida
        );
        
        // "Context" siempre suele ir como primer parametro, ya que permite acceder al objeto o cuenta con el que queremos interactuar
        // Dentro del context va al tipo de objeto o cuenta con el que deseamos interactuar. 
        let owner_id = context.accounts.owner.key(); // Accedemos al wallet address del caller 
        msg!("Owner id: {}", owner_id); // Print de verificacion

        let laptops: Vec<Laptop> = Vec::new(); // Crea un vector vacio 

        // Creamos un Struct de tipo Laboratorio y lo guardamos directamente 
        context.accounts.laboratorio.set_inner(Laboratorio { 
            owner: owner_id,
            nombre,
            capacidad_maxima,
            laptops,
        });
        msg!("Laboratorio {} creado con capacidad de {} laptops", context.accounts.laboratorio.nombre, capacidad_maxima);
        Ok(()) // Representa una transaccion exitosa 
    }

    //////////////////////////// Instruccion: Agregar Laptop /////////////////////////////////////
    /*
    Agrega una laptop al vector de laptops contenido en el struct Laboratorio. 
    En este caso el contexto empleado es el struct NuevaLaptop. Mientras que NuevoLaboratorio permite crear 
    Instancias de un Laboratorio. NuevaLaptop permite crear y modificar los valores relacionados a cualquier
    struct de tipo Laptop.

    Parametros de entrada:
        * modelo -> modelo de la laptop -> string
        * ram -> memoria ram en GB de la laptop -> u16
     */ 
    pub fn agregar_laptop(context: Context<NuevaLaptop>, modelo: String, ram: u16) -> Result<()> {
        require!( // Medida de seguridad para identificar que SOLO el owner del laboratorio sea el que hace cambios en ella
            context.accounts.laboratorio.owner == context.accounts.owner.key(), // Condicion, true -> continua, false -> error
            Errores::NoEresElOwner // Codigo de error, ver enum Errores
        ); 

        // Validacion extra: Limite de capacidad del laboratorio
        require!(
            context.accounts.laboratorio.laptops.len() < context.accounts.laboratorio.capacidad_maxima as usize,
            Errores::CapacidadExcedida
        );

        let laptop = Laptop { // Creacion de un struct tipo Laptop
            modelo,
            ram,
            estado: EstadoLaptop::Disponible, // Usa el nuevo enum en lugar de booleanos
            prestamos_totales: 0,
            usuario_actual: None, // Nadie la tiene prestada inicialmente
        };

        context.accounts.laboratorio.laptops.push(laptop); // Agrega la Laptop al vector de laptops del Laboratorio
        msg!("Laptop añadida. Ocupacion: {}/{}", context.accounts.laboratorio.laptops.len(), context.accounts.laboratorio.capacidad_maxima);

        Ok(()) // Transaccion exitosa
    }

    //////////////////////////// Instruccion: Eliminar Laptop /////////////////////////////////////
    /*
    Elimina una laptop a partir de su modelo. Error si la laptop no existe, Error si vector vacio. 

    Parametros de entrada:
        * modelo -> Modelo de la laptop -> string
     */
    pub fn eliminar_laptop(context: Context<NuevaLaptop>, modelo: String) -> Result<()> {
        require!( // Medida de seguridad
            context.accounts.laboratorio.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let laptops = &mut context.accounts.laboratorio.laptops; // Referencia mutable al vector de laptops

        for i in 0..laptops.len() { // Se itera mediante el indice todo el contenido del vector en busca de la laptop a eliminar
            if laptops[i].modelo == modelo { // Si lo encuentra procede a borrarla mediante el metodo remove
                laptops.remove(i);
                msg!("Laptop {} eliminada!", modelo); // Mensaje de borrado exitoso
                return Ok(()); // Transaccion exitosa
            }
        }
        Err(Errores::LaptopNoExiste.into()) // Transaccion fallida, nunca encontro la laptop
    }

    //////////////////////////// Instruccion: Ver Laptops /////////////////////////////////////
    /*
    Muestra en el log de la transaccion el contenido completo del vector de laptops del Laboratorio

    Parametros de entrada:
        Ninguno
     */
    pub fn ver_laptops(context: Context<NuevaLaptop>) -> Result<()> {
        require!( // Medida de seguridad 
            context.accounts.laboratorio.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        // :#? requiere que Laptop tenga atributo Debug. Permite la visualizacion completa del vector en el log
        msg!("El inventario de laptops actualmente es: {:#?}", context.accounts.laboratorio.laptops); // Print en log
        Ok(()) // Transaccion exitosa 
    }

    
    //////////////////////////// Instruccion Avanzada: Prestar / Devolver Equipo /////////////////////////////////////
    /* 
    Logica central de LabManager: Permite registrar un prestamo si la laptop esta disponible, o recibirla de vuelta,
    guardando el registro historico y el Pubkey de quien la tiene.
    */
    pub fn gestionar_prestamo(context: Context<NuevaLaptop>, modelo: String) -> Result<()> {
        require!( // Medida de seguridad
            context.accounts.laboratorio.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let borrower_id = context.accounts.owner.key(); // Simulamos que el admin registra el prestamo a la llave actual
        let laptops = &mut context.accounts.laboratorio.laptops; 
        
        for i in 0..laptops.len() { 
            if laptops[i].modelo == modelo { 
                match laptops[i].estado {
                    // RAMIFICACION 1: Si esta disponible, la prestamos
                    EstadoLaptop::Disponible => {
                        laptops[i].estado = EstadoLaptop::Prestado;
                        laptops[i].prestamos_totales += 1;
                        laptops[i].usuario_actual = Some(borrower_id); // Registramos quien se la llevo
                        msg!("EXITO: Laptop {} ha sido prestada. Total de usos historicos: {}", modelo, laptops[i].prestamos_totales);
                    },
                    // RAMIFICACION 2: Si ya esta prestada, la devolvemos al laboratorio
                    EstadoLaptop::Prestado => {
                        laptops[i].estado = EstadoLaptop::Disponible;
                        laptops[i].usuario_actual = None; // Borramos el registro activo
                        msg!("EXITO: Laptop {} fue devuelta al laboratorio y esta lista para usarse.", modelo);
                    },
                    // RAMIFICACION 3: Si esta en mantenimiento, bloqueamos la transaccion
                    EstadoLaptop::EnMantenimiento => {
                        return Err(Errores::EquipoEnMantenimiento.into());
                    }
                }
                return Ok(());
            }
        }

        Err(Errores::LaptopNoExiste.into()) // Transaccion fallida, equipo no existe
    }

    //////////////////////////// Instruccion Nueva: Reportar Mantenimiento /////////////////////////////////////
    /* 
    Nueva funcionalidad especifica de LabManager: Permite reportar un equipo defectuoso mandandolo a mantenimiento
    e inhabilitandolo para prestamos.
    */
    pub fn reportar_mantenimiento(context: Context<NuevaLaptop>, modelo: String, requiere_mantenimiento: bool) -> Result<()> {
        require!( // Medida de seguridad
            context.accounts.laboratorio.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let laptops = &mut context.accounts.laboratorio.laptops; 
        for i in 0..laptops.len() { 
            if laptops[i].modelo == modelo { 
                if requiere_mantenimiento {
                    laptops[i].estado = EstadoLaptop::EnMantenimiento;
                    laptops[i].usuario_actual = None; // Si estaba prestada, se fuerza la devolucion por falla tecnica
                    msg!("ALERTA CRITICA: Laptop {} enviada a mantenimiento tecnico.", modelo);
                } else {
                    laptops[i].estado = EstadoLaptop::Disponible;
                    msg!("REPARACION EXITOSA: Laptop {} regreso de mantenimiento.", modelo);
                }
                
                return Ok(());
            }
        }

        Err(Errores::LaptopNoExiste.into())
    }

}

/*
Codigos de error
Todos los codigos se almacenan en un enum con la siguiente estructura:
#[msg("MENSAJE DE ERROR")] (dentro de las comillas)
NombreDelError, (En camel case)
*/
#[error_code]
pub enum Errores {
    #[msg("Error, no eres el administrador del laboratorio que deseas modificar")]
    NoEresElOwner,
    #[msg("Error, el equipo (laptop) con el que deseas interactuar no existe en el inventario")]
    LaptopNoExiste,
    #[msg("Error, has alcanzado la capacidad maxima de laptops permitidas en este laboratorio")]
    CapacidadExcedida,
    #[msg("Error, no puedes prestar este equipo por que se encuentra en mantenimiento tecnico")]
    EquipoEnMantenimiento,
    #[msg("Error, la capacidad maxima a definir no puede ser mayor a 50 (limite fisico de memoria On-Chain)")]
    CapacidadInvalida,
}

#[account] // Especifica que el strcut es una cuenta que se almacenara en la blockchain
#[derive(InitSpace)] // Genera la constante INIT_SPACE y determina el espacio de almacenamiento necesario 
pub struct Laboratorio { // Define el Laboratorio
    owner: Pubkey, // Pubkey es un formato de llave publica de 32 bytes 

    #[max_len(60)] // Cantidad maxima de caracteres del string: nombre
    nombre: String,

    capacidad_maxima: u8, // Nuevo campo: limite logico del laboratorio

    #[max_len(50)] // Tamaño maximo real en memoria Onchain (Aca definimos el techo maximo de bytes a pagar)
    laptops: Vec<Laptop>,
}

/*
Enum para manejar de forma profesional e indubitable el estado del equipo,
reemplazando a los simples booleanos propensos a errores logicos.
*/
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Debug)]
pub enum EstadoLaptop {
    Disponible,
    Prestado,
    EnMantenimiento,
}

/*
Struct interno o secundario (No es una cuenta). Se define por derive y cuenta con los siguientes atributos:
    * AnchorSerialize -> Permite guardar el struct en la cuenta 
    * AnchorDeserialize -> Permite leer su contenido desde la cuenta 
    * Clone -> Para copiar su contenido o valores 
    * InitSpace -> Calcula el tamaño necesario para ser almacenado en la blockchain
    * PartialEq -> Para usar sus valores y compararlos con "=="
    * Debug -> Para mostrarlo en log con ":?" o ":#?"
*/
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Debug)]
pub struct Laptop {
    #[max_len(60)]
    modelo: String,

    ram: u16, 

    estado: EstadoLaptop, // Enum state machine

    prestamos_totales: u32, // Registro de metricas (vida util del equipo)
    
    usuario_actual: Option<Pubkey>, // Opcional: Almacena la wallet del alumno que lo tiene prestado
}


// Creacion de los contextos para las instrucciones (funciones)
#[derive(Accounts)] // Especifica que este struct describe las cuentas que se requieren para determinada instruccion
pub struct NuevoLaboratorio<'info> { // contexto de la instruccion
    #[account(mut)] 
    pub owner: Signer<'info>, // Se define que el owner como el que pagara la transaccion, por eso es mut, para que cambie el balance de la cuenta

    #[account(
        init, // Inidica que al llamar la instruccuion se creara una cuenta
        // puede ser remplazado por "init_if_needed" para que solo se cree una vez por caller
        payer = owner, // Se especifica que quien paga el llamado a la instruccion, en este caso el owner
        space = Laboratorio::INIT_SPACE + 8, // Se calcula el espacio requerido para almacenar el Solana Program On-Chain
        seeds = [b"lab_v2", owner.key().as_ref()], // CAMBIAMOS el string a "lab_v2" para generar una PDA completamente nueva y evitar conflictos con la version y memoria vieja
        bump // Metodo para determinar el id del laboratorio en base a lo anterior 
    )]
    pub laboratorio: Account<'info, Laboratorio>, // Se especifica que la cuenta creada (PDA) almacenara el laboratorio 

    pub system_program: Program<'info, System>, // Programa necesario para crear la cuenta 
}

// Contexto para la creacion y modificacion de laptops 
#[derive(Accounts)] // Especifica que este struct se requiere para todas las instrucciones relacionadas con la creacion o modificacion de Laptop
pub struct NuevaLaptop<'info> {
    pub owner: Signer<'info>, // El owner de la cuenta es quien paga la transaccion

    #[account(mut)] 
    pub laboratorio: Account<'info, Laboratorio>, // Se marca laboratorio como mutable porque se modificara tanto el vector como los elementos que contiene
}
