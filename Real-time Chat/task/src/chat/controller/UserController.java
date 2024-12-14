package chat.controller;

import chat.dto.User;
import chat.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/user/connect")
    public String connect(@RequestParam("username") String username, HttpSession session) {
        session.setAttribute("username", username);
        return "redirect:/chat.html";
    }

    @GetMapping("/user/getOnlineUsers")
    @ResponseBody
    public List<User> getOnlineUsers(HttpSession session) {
        String username = (String) session.getAttribute("username");
        return userRepository.getOnlineUsers(username);
    }
}
