const team = [
  {
    name: 'Marco Bianchi',
    role: 'Chef Ejecutivo',
    bio: 'Con 30 años de experiencia y origins de la Toscana, Marco aporta pasión y autenticidad en cada plato.',
    emoji: '👨‍🍳',
  },
  {
    name: 'Lucia Ferrari',
    role: 'Sommelier',
    bio: 'Experta en vinos italianos, Lucia cuida nuestra bodega con más de 200 etiquetas seleccionadas.',
    emoji: '🍷',
  },
  {
    name: 'Giovanni Russo',
    role: 'Maestro Pastas Artesanales',
    bio: 'Nuestro maestro de pasta fresca, prepara cada día tagliatelle, pappardelle y ravioli a mano.',
    emoji: '🍝',
  },
  {
    name: 'Sofia Romano',
    role: 'Pastelera',
    bio: 'Sus creaciones dulces son un viaje a los sabores de la tradición italiana.',
    emoji: '👩‍🍳',
  },
];

const milestones = [
  { year: '1985', event: 'Apertura del restaurante por la familia Bianchi' },
  { year: '1992', event: 'Primera estrella en la guía Michelin' },
  { year: '2001', event: 'Remodelación completa y apertura de la terraza' },
  { year: '2010', event: 'Premio "Mejor Pizzería de Italia"' },
  { year: '2018', event: 'Certificación DOP para nuestros ingredientes' },
  { year: '2023', event: 'Renovación del menú con enfoque en la sostenibilidad' },
];

export default function AboutPage() {
  return (
    <div className="bg-crema min-h-screen">
      <section className="bg-gradient-to-br from-noche-negro to-dorado-aceite/20 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-dorado-aceite font-body uppercase tracking-[0.3em] text-sm mb-3">
            Nuestra Historia
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4">
            Quiénes Somos
          </h1>
          <p className="text-bianco-mozzarella/80 text-lg max-w-2xl mx-auto">
            Una familia, una pasión, un restaurante. Desde hace casi 40 años
            llevamos la auténtica cocina italiana a Milán.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-dorado-aceite font-body uppercase tracking-[0.2em] text-sm">
              Desde 1985
            </p>
            <h2 className="font-display text-4xl font-bold text-noche-negro">
              Una Tradición Familiar
            </h2>
            <div className="space-y-4 text-tierra-marron leading-relaxed">
              <p>
                La Dolce Vita nació del sueño de Antonio y Maria Bianchi,
                dos jóvenes italianos que querían llevar los sabores de su
                Toscana a Lombardía. Con pocos recursos pero mucha pasión,
                abrieron las puertas de este local en el corazón de Milán.
              </p>
              <p>
                Hoy, casi 40 años después, el restaurante es gestionado por la segunda
                generación de la familia. El hijo Marco, chef con treinta años
                de experiencia, continua la tradición culinaria manteniendo vivo
                el vínculo con las raíces toscanas.
              </p>
              <p>
                Cada plato que sale de nuestra cocina lleva consigo la historia
                de una familia, el amor por la tradición y el compromiso con
                la calidad. Ingredientes frescos, recetas de la abuela y una
                pasión que se transmite de generación en generación.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-bianco-mozzarella to-dorado-aceite/20 rounded-2xl p-8 shadow-xl">
              <div className="text-center space-y-4">
                <span className="text-8xl block">🏰</span>
                <p className="font-display text-xl italic text-tierra-marron">
                  "La cocina es el corazón del hogar, y nosotros abrimos nuestras
                  puertas a quien busque un pedacito de Italia."
                </p>
                <p className="font-bold text-noche-negro">
                  — Antonio Bianchi, Fundador
                </p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-verde-basilico/10 rounded-full -z-10" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-rosso-pomodoro/10 rounded-full -z-10" />
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-dorado-aceite font-body uppercase tracking-[0.2em] text-sm mb-3">
              Nuestra Línea de Tiempo
            </p>
            <h2 className="section-title">Más de 35 Años de Historia</h2>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-dorado-aceite/30" />
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`flex items-center ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                    <div className="bg-crema rounded-xl p-6 shadow-md">
                      <span className="text-dorado-aceite font-display text-2xl font-bold">
                        {milestone.year}
                      </span>
                      <p className="text-tierra-marron mt-2">{milestone.event}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-dorado-aceite rounded-full border-4 border-white shadow" />
                  <div className="w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-dorado-aceite font-body uppercase tracking-[0.2em] text-sm mb-3">
              Nuestro Equipo
            </p>
            <h2 className="section-title">Las Personas que Hacen la Diferencia</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              Un equipo de profesionales apasionados, unidos por el amor
              a la cocina italiana auténtica.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div key={member.name} className="card text-center p-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-bianco-mozzarella to-dorado-aceite/20 rounded-full flex items-center justify-center text-5xl mb-4">
                  {member.emoji}
                </div>
                <h3 className="font-display text-xl font-bold text-noche-negro">
                  {member.name}
                </h3>
                <p className="text-dorado-aceite font-semibold text-sm mt-1">
                  {member.role}
                </p>
                <p className="text-tierra-marron/70 text-sm mt-3 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-noche-negro text-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <span className="text-4xl">🏆</span>
            <h3 className="font-display text-3xl font-bold text-dorado-aceite">
              38+
            </h3>
            <p className="text-bianco-mozzarella/70">Años de Experiencia</p>
          </div>
          <div className="space-y-2">
            <span className="text-4xl">👨‍👩‍👧‍👦</span>
            <h3 className="font-display text-3xl font-bold text-dorado-aceite">
              50,000+
            </h3>
            <p className="text-bianco-mozzarella/70">Clientes Satisfechos</p>
          </div>
          <div className="space-y-2">
            <span className="text-4xl">🍽️</span>
            <h3 className="font-display text-3xl font-bold text-dorado-aceite">
              200+
            </h3>
            <p className="text-bianco-mozzarella/70">Recetas en la Tradición</p>
          </div>
        </div>
      </section>
    </div>
  );
}
