const mongoose = require('mongoose');

// Configuration de base (remplacez par votre URL MongoDB)
const DB_URL = process.env.DATABASE_URL || 'mongodb+srv://dahmaneaissa2:aBEOPQgJlzxaQOcq@standupcomedy.h8h8s.mongodb.net/standup-comedy?retryWrites=true&w=majority&appName=standupcomedy';

async function debugEvents() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(DB_URL);
    console.log('✅ Connecté à MongoDB');

    // Schéma simple pour les événements
    const eventSchema = new mongoose.Schema({}, { strict: false });
    const Event = mongoose.model('Event', eventSchema);

    // Récupérer tous les événements
    const events = await Event.find({});
    console.log(`\n📊 Nombre total d'événements dans la DB: ${events.length}`);

    if (events.length > 0) {
      console.log('\n📅 Liste des événements:');
      events.forEach((event, index) => {
        console.log(`${index + 1}. "${event.title}" - Date: ${event.date} - Status: ${event.status} - Organisateur: ${event.organizer}`);
      });
    }

    // Schéma simple pour les candidatures
    const applicationSchema = new mongoose.Schema({}, { strict: false });
    const Application = mongoose.model('Application', applicationSchema);

    // Récupérer toutes les candidatures
    const applications = await Application.find({});
    console.log(`\n📨 Nombre total de candidatures dans la DB: ${applications.length}`);

    // Schéma simple pour les utilisateurs
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema);

    // Récupérer les super admins
    const superAdmins = await User.find({ role: 'SUPER_ADMIN' });
    console.log(`\n👑 Super admins trouvés: ${superAdmins.length}`);
    superAdmins.forEach(admin => {
      console.log(`   • ${admin.firstName} ${admin.lastName} (${admin.email}) - ID: ${admin._id}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Déconnecté de MongoDB');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

debugEvents(); 