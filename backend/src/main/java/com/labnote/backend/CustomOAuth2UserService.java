package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        Optional<User> userOptional = userRepository.findByUsername(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update user details if necessary
            user.setEmail(email);
            user.setPicture(picture);
            user.setProvider(provider);
        } else {
            // Create a new user
            user = new User();
            user.setUsername(email); // For consistency, username is email
            user.setEmail(email);
            user.setPicture(picture);
            user.setProvider(provider);
            // Create a random, unusable password for OAuth users
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        }
        userRepository.save(user);

        return oAuth2User;
    }
}
