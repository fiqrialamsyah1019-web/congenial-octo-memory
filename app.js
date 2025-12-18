const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const { sequelize, Project, Station } = require('./models');
const LineBalancer = require('./utils/Balancer');

const app = express();
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// CPMK-2: Implementasi Async/Await untuk Query Database
app.get('/', async (req, res) => {
    const projects = await Project.findAll();
    res.render('home', { projects });
});

app.get('/input', (req, res) => res.render('input'));

app.post('/calculate', async (req, res) => {
    const { projectName, mode, taktTime, s_name, s_time } = req.body;
    const project = await Project.create({ name: projectName, mode, takt: parseFloat(taktTime) || 0 });
    
    const stationData = s_name.map((name, i) => ({ 
        name, 
        time: parseFloat(s_time[i]), 
        ProjectId: project.id 
    }));
    await Station.bulkCreate(stationData);
    res.redirect(`/results/${project.id}`);
});

app.get('/results/:id', async (req, res) => {
    const project = await Project.findByPk(req.params.id, { include: [Station] });
    // Menggunakan Instance Class OOP
    const balancer = new LineBalancer(project.Stations, project.mode, project.takt);
    res.render('results', { project, results: balancer.calculate() });
});

sequelize.sync().then(() => app.listen(3000, () => console.log('Server: http://localhost:3000')));
// --- ROUTE: Hapus Proyek (CPMK-2: Async/Await & CRUD) ---
app.post('/delete/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // Menghapus stasiun yang terkait terlebih dahulu (Cascading manual)
        await Station.destroy({ where: { ProjectId: projectId } });
        
        // Menghapus proyek utama
        await Project.destroy({ where: { id: projectId } });
        
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Gagal menghapus data: " + err.message);
    }
});
// GET: Tampilkan Form Edit
app.get('/edit/:id', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, { include: [Station] });
        res.render('edit', { project });
    } catch (err) { res.status(500).send(err.message); }
});

// POST: Proses Update Data (CPMK-2: Async/Await)
app.post('/update/:id', async (req, res) => {
    try {
        const { projectName, mode, taktTime, s_id, s_name, s_time } = req.body;
        
        // 1. Update Data Proyek
        await Project.update(
            { name: projectName, mode: mode, takt: parseFloat(taktTime) || 0 },
            { where: { id: req.params.id } }
        );

        // 2. Update Data Stasiun (Looping untuk setiap stasiun)
        // Kita menggunakan Promise.all untuk efisiensi async
        const updatePromises = s_id.map((id, i) => {
            return Station.update(
                { name: s_name[i], time: parseFloat(s_time[i]) },
                { where: { id: id } }
            );
        });
        await Promise.all(updatePromises);

        res.redirect(`/results/${req.params.id}`);
    } catch (err) { res.status(500).send(err.message); }
});
