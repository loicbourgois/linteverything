/*
 * The MIT License
 *
 * Copyright 2018 Team SI.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

package centralellile.a2017a2018.poo4.seance1.tests;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.Persistence;
import modele.Medecin;
import modele.Service;

/**
 * Represente les tests sur les associations médecins et services.
 * @author user
 */
public class Test4 {
	/**
	 * Main methode.
	 * Start of the program.
	 */
	public static void main(String[] args) {
		final EntityManagerFactory emf = Persistence.createEntityManagerFactory("hopitalPU");
		final EntityManager em = emf.createEntityManager();

		try {
			final EntityTransaction et = em.getTransaction();
			try {
				et.begin();
				// création d’entités persistantes
				Service serv1 = new Service("Cardiologie", "Bat A, 1er étage");
				Medecin med1 = new Medecin("Trancen", "Jean", 2135.23);
				Medecin med2 = new Medecin("Gator", "Coralie", 3156.00);
				Medecin med3 = new Medecin("Gator", "Magalie", 2545.37);
				serv1.addMedecin(med1);
				serv1.addMedecin(med2);
				serv1.addMedecin(med3);
				Service serv2 = new Service("Pneumologie", "Bat B, 1er étage");
				Medecin med4 = new Medecin("Hitmieu", "Helmer", 1873.30);
				serv2.addMedecin(med4);
				Service serv3 = new Service("Urgence", "Bat C, 1er étage");
				Medecin med5 = new Medecin("Cambronne", "Maude", 3765.20);
				Medecin med6 = new Medecin("Haybon", "Sylvain", 2980.00);
				serv3.addMedecin(med5);
				serv3.addMedecin(med6);
				med4.addServiceDirige(serv2);
				med5.addServiceDirige(serv1);
				med5.addServiceDirige(serv3);
				med2.setChef(med1); // Ajout du médecin 1 comme chef du médecin 2
				med3.setChef(med1);
				med5.setChef(med6);

				em.persist(serv1);
				em.persist(serv2);
				em.persist(serv3);
				et.commit();
			} catch (Exception ex) {
				et.rollback();
			}
		} finally {
			if (em != null && em.isOpen()) {
				em.close();
			}
			if (emf != null && emf.isOpen()) {
				emf.close();
			}
		}
	}
}
