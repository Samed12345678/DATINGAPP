import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSwipeSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all users
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Get a specific user
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Create a new user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get users for swiping (excludes already swiped profiles)
  app.get("/api/users/:id/swipe", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profiles = await storage.getUsersForSwiping(id);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profiles for swiping" });
    }
  });

  // Get user's remaining daily credits
  app.get("/api/users/:id/credits", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check and reset credits if needed
      await storage.checkAndResetCreditsIfNeeded(id);
      
      // Get updated credits
      const credits = await storage.getRemainingCredits(id);
      res.json({ credits });
    } catch (error) {
      res.status(500).json({ message: "Failed to get remaining credits" });
    }
  });

  // Create a swipe (left or right)
  app.post("/api/swipes", async (req, res) => {
    try {
      const swipeData = insertSwipeSchema.parse(req.body);
      
      // Check if users exist
      const swiper = await storage.getUser(swipeData.swiperId);
      const swiped = await storage.getUser(swipeData.swipedId);
      
      if (!swiper || !swiped) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough credits for a right swipe (only needed for likes)
      if (swipeData.liked) {
        const credits = await storage.getRemainingCredits(swipeData.swiperId);
        
        if (credits <= 0) {
          return res.status(403).json({ 
            message: "Not enough credits to like a profile", 
            creditsRemaining: 0
          });
        }
        
        // Deduct a credit for the like
        await storage.decrementCredits(swipeData.swiperId);
      }
      
      // Create the swipe
      const swipe = await storage.createSwipe(swipeData);
      
      // Update the profile's popularity score
      if (swipeData.liked) {
        // Increase score when liked
        await storage.incrementLikesReceived(swipeData.swipedId);
      } else {
        // Decrease score when disliked
        await storage.incrementDislikesReceived(swipeData.swipedId);
      }
      
      // If it's a right swipe (like), check for a match
      if (swipeData.liked) {
        // Check if the other user has already liked this user
        const otherSwipe = await storage.getSwipe(swipeData.swipedId, swipeData.swiperId);
        
        if (otherSwipe && otherSwipe.liked) {
          // It's a match! Create a match record
          const match = await storage.createMatch(swipeData.swiperId, swipeData.swipedId);
          
          // Get updated remaining credits
          const creditsRemaining = await storage.getRemainingCredits(swipeData.swiperId);
          
          return res.status(201).json({ 
            swipe, 
            isMatch: true,
            match,
            matchedUser: swiped,
            creditsRemaining
          });
        }
      }
      
      // Get updated remaining credits
      const creditsRemaining = await storage.getRemainingCredits(swipeData.swiperId);
      
      // Return the swipe with no match
      res.status(201).json({ 
        swipe, 
        isMatch: false,
        creditsRemaining
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid swipe data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create swipe" });
    }
  });

  // Get matches for a user
  app.get("/api/users/:id/matches", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const matches = await storage.getMatches(id);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to get matches" });
    }
  });

  // Get messages for a match
  app.get("/api/matches/:id/messages", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }
      
      const messages = await storage.getMessages(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Get unread message count for a user
  app.get("/api/users/:id/unread", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const count = await storage.getUnreadMessageCount(id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get unread message count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
