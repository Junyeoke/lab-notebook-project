package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        Optional<User> userOptional = userRepository.findByUsername(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update user details if necessary
            user.setUsername(email); // Ensure username is the email
        } else {
            // Create a new user
            user = new User();
            user.setUsername(email);
            // OAuth users might not have a password
            user.setPassword(""); // Or handle it differently
        }
        userRepository.save(user);

        return oAuth2User;
    }
}
